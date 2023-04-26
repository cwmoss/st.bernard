// name: st.bernard

export default class Validator {
  fields = new WeakMap();

  f = null;

  constructor(form) {
    this.f = form;
    this.init();
    this.observe();
    console.log(
      "++ format",
      format("hello i'm {name} and {age} old", { name: "Mike", age: 24 })
    );
  }

  init() {
    this.get_rules();
    this.get_fields();
    let me = this;
    addEvent(this.f, "submit", function (e) {
      me.on_submit(e);
    });
  }

  observe() {
    const targetNode = this.f;

    // Options for the observer (which mutations to observe)
    const config = { attributes: true, childList: true, subtree: true };

    // Callback function to execute when mutations are observed
    const callback = (mutationList, observer) => {
      for (const mutation of mutationList) {
        if (mutation.type === "childList") {
          //  console.log("A child node has been added or removed.");
          this.get_fields();
        } else if (mutation.type === "attributes") {
          //   console.log(`The ${mutation.attributeName} attribute was modified.`);
        }
      }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);

    // Later, you can stop observing
    // observer.disconnect();
  }

  get data() {
    return new FormData(this.f);
  }

  get_value(el) {
    let data = this.data;
    let name = get_name(el);
    return this.fields.get(el).is_array ? data.getAll(name) : data.get(name);
  }

  get_fields(only_visible) {
    // console.log("elements...", this.f.elements);
    let els = Array.from(this.f.elements);
    // console.log(els);
    let fields = [];
    for (let el of els) {
      // console.log("get_fields", el);
      if (
        el.matches("input,select,textarea") &&
        get_name(el) && // &&   is_visible(el)
        (!only_visible || (only_visible && is_visible(el)))
      ) {
        this.update(el);
        fields.push(el);
      }
    }
    return fields;
  }
  update_map(el, prop, prop_val) {
    let f = this.fields.get(el);
    f[prop] = prop_val;
    this.fields.set(el, f);
  }
  update(el, trigger) {
    const name = get_name(el);
    if (!this.fields.has(el)) {
      let props = {
        fresh: true,
        name: name,
        id: el.id,
        has_error: false,
        is_click: is_click(el),
        is_array: is_array(el),
      };

      let me = this;
      if (!props.is_click) {
        addEventOnce(el, "input", function () {
          props.fresh = false;
          me.fields.set(el, props);
        });
        addEvent(el, "blur", function (e) {
          me.validate_ev(e, me);
        });
        addEvent(el, "input", function (e) {
          me.clear_ev(e, me);
        });
      } else {
        props.fresh = false;
        addEvent(el, "input", function (e) {
          console.log("input on click-el", e.target);
          me.validate_ev(e, me);
        });
      }
      // console.log("init field", props);
      this.fields.set(el, props);
    }
    const field = this.fields.get(el);
  }
  on_submit(e) {
    console.log("+++ submit", e.submitter, e, this);
    if (hasAttr(e.submitter, "formnovalidate")) return;
    let fields = this.get_fields(true);
    let ok = this.validate_fields(fields);
    console.log("... all ok?", ok);
    e.preventDefault();
  }
  validate_ev(e) {
    let el = e.target;
    if (this.fields.get(el)?.fresh) return;

    let val = this.get_value(el);

    // console.log("validate", e, el);
    // console.log("this", val);
    this.validate(el, get_name(el), val);
  }
  clear_ev(e) {
    let p = this.fields.get(e.target);
    if (p.has_error) {
      this.add_error(e.target, "");
    }
  }
  validate_fields(els) {
    let ok = true;
    for (let el of els) {
      let name = get_name(el);
      let val = this.get_value(el);
      if (this.validate(el, name, val) !== true) {
        // console.log("err on ", name, el);
        ok = false;
      }
    }
    return ok;
  }
  is_error_msg(rsp) {
    if (rsp === false) return true;
    if (!rsp) return false;
    if (rsp === true) return false;
    if (typeof rsp === "string") return rsp;
    if (typeof rsp === "object") {
      if (rsp.ok === false) {
        return rsp.msg;
      }
    }
    return false;
  }
  async validate(el, name, val) {
    let rules = this.rules.r[name] ? this.rules.r[name] : [];
    console.log("rules...", name, this.rules.r);
    let msg = [];
    for (let rule of rules) {
      // console.log("v", rule);
      let m = methods[rule];
      // console.log("m", m);
      if (m) {
        let promise = Promise.resolve(m(val, el)).then((ok) => {
          console.log("validation result", rule, ok);
          let rsp_msg = this.is_error_msg(ok);
          if (rsp_msg) msg.push(this.get_message(name, rule, rsp_msg));
        });
        let r = await promise;
      } else {
        console.log("missing method:", rule);
      }
    }
    console.log("+++ adding errors", msg);
    if (msg.length) {
      this.add_error(el, msg);
      this.update_map(el, "has_error", true);
      return false;
    } else {
      this.add_error(el, "");
      this.update_map(el, "has_error", false);
      return true;
    }
  }

  static add_method(name, method, message) {
    methods[name] = method;
    messages[name] =
      message !== undefined
        ? message
        : messages[name]
        ? messages[name]
        : "Invalid";
  }

  static empty(value) {
    if (Array.isArray(value)) {
      return value.length == 0;
    }
    return value === undefined || value === null || value.length == 0;
  }
  hey() {
    console.log("huhu");
  }
  get_rules() {
    let rules_el = document.querySelector(".vrules", this.f);
    this.rules = JSON.parse(rules_el.dataset.rules);
  }

  add_error(field, msg) {
    console.log("add-error", msg, field);
    let parent = field.closest(".fgroup");
    if (!parent) parent = field.parentNode;
    let msg_container = parent.querySelector(".invalid-feedback");
    // console.log("msg container", msg_container);
    let msg_html = msg ? msg.join("<p>") : "";
    if (!msg_container) {
      parent.insertAdjacentHTML(
        "beforeend",
        '<div class="invalid-feedback">' + msg_html + "</div>"
      );
    } else {
      msg_container.innerHTML = msg_html;
    }

    if (msg) {
      setAttr(field, "aria-invalid", true);
      addClass(field, "is-invalid");
      addClass(parent, "is-invalid");
      // msg_container.innerHTML = msg;
    } else {
      setAttr(field, "aria-invalid", false);
      remClass(field, "is-invalid");
      remClass(parent, "is-invalid");
      // msg_container.innerHTML = "";
    }
  }
  get_message(name, rule, rmsg) {
    let msg = "";
    if (this.rules["m"][name] && this.rules["m"][name][rule])
      msg = this.rules["m"][name][rule];
    if (!msg && rmsg && typeof rmsg === "string") msg = rmsg;
    if (!msg)
      msg = messages[rule]
        ? messages[rule]
        : "Error on field " + name + " with rule " + rule;
    console.log("+++ msg ", name, rule, msg);
    return format(msg, {});
  }
}

const methods = {
  required: function (value, element, param) {
    // Check if dependency is met
    //if (!this.depend(param, element)) {
    //  return "dependency-mismatch";
    //}
    // console.log("required", value);
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null && value.length > 0;
  },

  // https://jqueryvalidation.org/email-method/
  email: function (value, element) {
    // From https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
    // Retrieved 2014-01-14
    // If you have a problem with this implementation, report a bug against the above spec
    // Or use custom methods to implement your own email validation
    // console.log("email-regex for", value);
    return (
      Validator.empty(value) ||
      /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
        value
      )
    );
  },
  fetch: async function (value, element) {
    if (!value) return true;
    // let result = await fetch("/check_username", { value });
    // return false;
    let url = "/check_username";
    let data = { name: get_name(element), value: value };
    let response_data = {};
    let response;
    addClass(element.parentNode, "pending");
    try {
      response = await fetch(url, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Network response was not OK");
      }
      response_data = await response.json();
      console.log("fetch data", response_data);
      remClass(element.parentNode, "pending");
      return response_data;
    } catch (error) {
      console.log("error in fetch method");
    }
    return true;
  },
};

const messages = {
  required: "This field is required.",
  remote: "Please fix this field.",
  email: "Please enter a valid email address.",
  url: "Please enter a valid URL.",
  date: "Please enter a valid date.",
  dateISO: "Please enter a valid date (ISO).",
  number: "Please enter a valid number.",
  digits: "Please enter only digits.",
  equalTo: "Please enter the same value again.",
  maxlength: "Please enter no more than {val} characters.",
  minlength: "Please enter at least {val} characters.",
  rangelength: "Please enter a value between {min} and {max} characters long.",
  range: "Please enter a value between {min} and {max}.",
  max: "Please enter a value less than or equal to {val}.",
  min: "Please enter a value greater than or equal to {val}.",
  step: "Please enter a multiple of {val}.",
  fetch: "Your Input is invalid",
};

const format = (msg, params) =>
  msg.replace(
    /{(\w+)}/g,
    (placeholderWithDelimiters, placeholderWithoutDelimiters) =>
      params.hasOwnProperty(placeholderWithoutDelimiters)
        ? params[placeholderWithoutDelimiters]
        : placeholderWithDelimiters
  );

const optional = (el) => false;
const is_visible = (el) =>
  el.style.display !== "none" &&
  el.visibility !== "hidden" &&
  el.offsetParent !== null;

const isHtmlElement = (el, type) => {
  const isInstanceOfHTML = el instanceof HTMLElement;
  return type ? isInstanceOfHTML && el.matches(type) : isInstanceOfHTML;
};

const includes = (array, string) =>
  Array.isArray(array) && array.includes(string);

const addEvent = (el, event, callback) => el.addEventListener(event, callback);

const addEventOnce = (el, event, callback) =>
  el.addEventListener(event, callback, { once: true });

const getAttr = (el, attr) => el.getAttribute(attr);
const hasAttr = (el, attr) => el.hasAttribute(attr);
const setAttr = (el, attr, value = "") => el.setAttribute(attr, value);

const addClass = (el, cls) => el.classList.add(cls);
const remClass = (el, cls) => el.classList.remove(cls);

const getEl = (el) =>
  isHtmlElement(el)
    ? el
    : document.getElementById(el) || document.querySelector(`[name ="${el}"]`);

const is_click = (el) =>
  el.tagName == "SELECT" || el.type == "checkbox" || el.type == "radio";
const is_array = (el) =>
  el.hasAttribute("multiple") ||
  (el.type == "checkbox" && get_name(el).endsWith("[]"));

const getForm = (el) => el && el.closest("form");

const get_name = (el) => getAttr(el, "name");
const get_name_or_id = (el) => getAttr(el, "name") || getAttr(el, "id");

const trim = function (str) {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim#Polyfill
  return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
};

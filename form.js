import Validator from "./validator.js";

Validator.add_method(
  "otto",
  function (val) {
    return val == "otto";
  },
  "Must be Otto!"
);

document.addEventListener("alpine:init", () => {
  console.log("alpine-init");
  Alpine.directive("validatetable", (el, alp_opts, { evaluate }) => {
    // el.textContent = el.textContent.toUpperCase();
    let v = new Validator(el);
    console.log("rulesX", v, evaluate(alp_opts.expression));

    el.validate = function () {
      alert("validate!");
    };

    console.log("+++ formDAta", v.hey());
  });

  Alpine.data("form", () => ({
    isopen: false,
    has_friends: false,
    xxinit() {
      console.log("init");
      let rules = JSON.parse(this.$refs.vrules.dataset.rules);
      console.log("rules", rules);
      this.validation_init(rules);
    },
    toggle() {
      this.isopen = !this.isopen;
      // this.$root.validate();
      // console.log("rules", JSON.parse(this.$refs.vrules.dataset.rules));
    },
    validation_init(rules) {
      const validation = new JustValidate(this.$root, {
        validateBeforeSubmitting: true,
      });
      validation.addField("#exampleInputEmail1", [
        {
          rule: "required",
          errorMessage: "Email is required",
        },
        {
          rule: "email",
          errorMessage: "Email is invalid!",
        },
      ]);
    },
  }));
});

/*
    const FIELD_SELECTOR = "input,select,textarea";

    const cleanText = (str) => String(str).trim();
    console.log("huhu");
    const getData = (strOrEl) => {
      const el = getEl(strOrEl);
      let data = formData.get(getForm(el));
      if (!data) return false;
      if (isHtmlElement(el, "form")) return Object.values(data);
      if (isHtmlElement(el, "fieldset"))
        return Object.values(data).filter((val) => val.set === el);
      if (isHtmlElement(el, "input,select,textarea")) return data[getName(el)];
    };

    const optional = function (element) {
      var val = this.elementValue(element);
      return (
        !$.validator.methods.required.call(this, val, element) &&
        "dependency-mismatch"
      );
    };

    const formData = new WeakMap();

    const addEvents = function (field) {
      console.log("add events", field);
    };

    const defaultData = function (field) {
      return {
        name: field.name,
        type: field.type,
      };
    };

    formData.get(getForm(getEl(el)));

    const fields = el.querySelectorAll(FIELD_SELECTOR);
    fields.forEach((field) => {
      let name = getName(field);
      console.log("name", name);
      if (name) {
        formData.set(field, defaultData(field));
        addEvents(field);
        if (name == "name") {
          addError(field, "fehler");
        }
        if (name == "name") {
          addError(field, "");
        }
      }
    });
    */

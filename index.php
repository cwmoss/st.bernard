<?php
// php -S localhost:2023
$http_method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];
// print file_get_contents('php://input');
$the_route = match ([$http_method, $path]) {
    ['POST', '/'] => ['index', $_POST],
    ['GET', '/'] => ['index'],
    ['POST', '/check_username'] => ['check_username', json_decode(file_get_contents('php://input'), true)],
    default => ['404']
};

function handle_request($page, $params = []) {
    if ($page == 'check_username') {
        sleep(2);
        $resp = ['ok' => true, 'in' => $params];
        if ($params['value'] == 'anna' || $params['value'] == 'otto') {
            $resp = ['ok' => false, 'msg' => 'This name is already taken'];
        }
        json_resp($resp);
    }
    if ($page == '404') {
        print "404";
    }
}

function json_resp($data) {
    header('Content-Type: application/json');
    print json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

function route_match($pattern, $path = "", &$params = []) {
    $VARIABLE_REGEX = <<<'REGEX'
\{
    \s* ([a-zA-Z_][a-zA-Z0-9_-]*) \s*
    (?:
        : \s* ([^{}]*(?:\{(?-1)\}[^{}]*)*)
    )?
\}
REGEX;

    $regex = preg_replace_callback('~' . $VARIABLE_REGEX . '~x', function ($mat) {
        return '(?P<' . $mat[1] . '>' . ($mat[2] ?? '[^/]+') . ')';
    }, $pattern);

    if (preg_match("!$regex!", $path, $matches)) {
        $params = array_filter($matches, fn ($e) => !is_numeric($e),  ARRAY_FILTER_USE_KEY);
        return $path;
    }
    return null;
}

handle_request(...$the_route);

if ($the_route[0] != 'index') exit;
?>
<!DOCTYPE html>
<html lang="en">
<?php

$rules = [
    'email' => [
        'required', 'email'
    ],
    'name' => [
        'required', 'fetch',
    ],
    'nickname' => [
        'required'
    ],
    'colors[]' => [
        'required'
    ],
    'breakfast' => ['required']
];
$messages = [
    'email' => ['required' => 'We need your email address', 'email' => 'This is not a valid email address'],
    'nickname' => ['required' => 'Because we are your friends, we need to know your nickname']
];

?>

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link rel="icon" type="image/svg" href="green.svg" sizes="32x32">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>form</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-KK94CHFLLe+nY2dmCWGMq91rCGa5gtU4mk92HdvYe+M/SXH301p5ILy+dN9+nJOZ" crossorigin="anonymous">
    <style>
        main {
            margin-top: 2em;
        }

        [x-cloak] {
            display: none !important;
        }

        .fgroup.is-invalid .invalid-feedback {
            display: block;
        }

        .pending input {
            background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23808080' d='M10.72 19.9a8 8 0 0 1-6.5-9.79A7.77 7.77 0 0 1 10.4 4.16a8 8 0 0 1 9.49 6.52A1.54 1.54 0 0 0 21.38 12h.13a1.37 1.37 0 0 0 1.38-1.54 11 11 0 1 0-12.7 12.39A1.54 1.54 0 0 0 12 21.34h0A1.47 1.47 0 0 0 10.72 19.9Z'%3E%3CanimateTransform attributeName='transform' type='rotate' dur='0.75s' values='0 12 12%3B360 12 12' repeatCount='indefinite'/%3E%3C/path%3E%3C/svg%3E");
            background-size: 20px;
            background-position: calc(100% - 8px) 8px;
            background-repeat: no-repeat;
        }
    </style>

    <script type="module" src="form.js?<?= time() ?>"></script>
    <script src="//unpkg.com/alpinejs" defer></script>

    <!-- script src="https://unpkg.com/just-validate@latest/dist/just-validate.production.min.js"></script -->

    <script>
        /*
            https://github.com/colinaut/alpinejs-plugin-simple-validate
        */
    </script>
</head>

<body>
    <main class="container">
        <h1>Testformx</h1>


        <form x-data="form()" x-validatetable x-cloak novalidate>

            <div class="mb-3"><label for="email" class="form-label">Email address</label>
                <input type="email" value="rw" name="email" class="form-control" id="email" aria-describedby="emailHelp">
                <div id="emailHelp" class="form-text">required AND email rule</div>
                <div class="invalid-feedback">

                </div>
            </div>
            <div class="mb-3"><label for="name" class="form-label">Name</label>
                <input type="text" name="name" class="form-control " id="name">
                <div id="nameHelp" class="form-text">Try "anna" or "otto" ... they are taken ("fetch" rule)</div>

                <div class="invalid-feedback">

                </div>

            </div>
            <div class="mb-3 form-check"><input type="checkbox" x-model="has_friends" name="has_friends" value="1" class="form-check-input " id="exampleCheck1">
                <label class="form-check-label" for="exampleCheck1">I have friends</label>
                <div class="invalid-feedback">

                </div>
            </div>

            <div class="mb-3" x-show="has_friends" x-transition>
                <div><label for="nickname" class="form-label">...they call me</label>
                    <input type="text" name="nickname" class="form-control " id="nickname">
                    <div class="invalid-feedback">

                    </div>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-check-label" for="breakfast">Breakfast</label>
                <select class="form-select" id="breakfast" name="breakfast" aria-label="Default select example">
                    <option selected value="">Please Select</option>
                    <option value="eggs">Eggs</option>
                    <option value="toast">Toast</option>
                    <option value="coffee">Coffee Only</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-check-label" for="lunch">Lunch</label>
                <select class="form-select" id="lunch" name="lunch[]" multiple aria-label="Default select example">
                    <option selected disabled>Please Select</option>
                    <option value="pasta">Pasta</option>
                    <option value="pizza">Pizza</option>
                    <option value="burger">Burger</option>

                    <option value="salad">Salad</option>
                    <option value="bockwurst">Bockwurst</option>
                </select>
            </div>

            <div class="mb-3 fgroup">
                <div class="form-check form-check-inline">
                    <input class="form-check-input" name="colors[]" type="checkbox" id="inlineCheckbox1" value="red">
                    <label class="form-check-label" for="inlineCheckbox1">Red</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" name="colors[]" type="checkbox" id="inlineCheckbox2" value="blue">
                    <label class="form-check-label" for="inlineCheckbox2">Blue</label>
                </div>
                <div class="form-check form-check-inline">
                    <input class="form-check-input" name="colors[]" type="checkbox" id="inlineCheckbox3" value="green" checked disabled>
                    <label class="form-check-label" for="inlineCheckbox3">Green (disabled)</label>
                </div>
                <div class="invalid-feedback">
                </div>
            </div>

            <span class="vrules" x-ref="vrules" data-rules="<?= htmlspecialchars(json_encode(['r' => $rules, 'm' => $messages])) ?>"></span>
            <span class="xxvrules" x-ref="xxvrules" data-rules="{&quot;kunde[tel_p_all]&quot;:{&quot;format&quot;:&quot;^0&quot;},&quot;kunde[email]&quot;:{&quot;email&quot;:true,&quot;required&quot;:true,&quot;maxlength&quot;:50}}" data-xfv-messages="{&quot;kunde[tel_p_all]&quot;:{&quot;format&quot;:&quot;Ihre Vorwahl muss mit einer 0 beginnen.&quot;},&quot;kunde[email]&quot;:{&quot;email&quot;:&quot;Ihre E-Mail ist ung\u00fcltig.&quot;,&quot;required&quot;:&quot;Bitte geben Sie Ihre E-Mail an.&quot;,&quot;maxlength&quot;:&quot;Ihre E-Mail ist zu lang (maximal 50 Zeichen).&quot;}}"></span>
            <template x-if="isopen">
                <div>Sending...</div>
            </template>
            <button @click="toggle" type="submit" class="btn btn-primary">Submit</button>

        </form>

        <div x-data="{ open: false }" class="mt-5">
            <button @click=" open=true">Expand</button>

            <span x-show="open">
                Content...
            </span>
        </div>




    </main>


</body>

</html>
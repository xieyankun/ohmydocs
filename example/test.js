var compose = function () {
    var fns = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        fns[_i] = arguments[_i];
    }
    return fns.reduce(function (f, g) { return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return f(g.apply(void 0, args));
    }; });
};
var example = compose(
    function (val) { 
        console.log(1); return "1<" + val + ">"; 
    },
    function (val) {
        console.log(2); return "2<" + val + ">"; 
    },
    function (val) {
        console.log(3); return "3<" + val + ">"; 
    }
);
console.log(example('hello'));

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const express = require("../src/express");

function render(path, options, fn) {
    fs.readFile(path, 'utf8', function (err, str) {
        if (err) return fn(err);
        str = str.replace('{{user.name}}', options.user.name);
        fn(null, str);
    });
}

describe('app', () => {
    describe('.engine(ext, fn)', () => {
        it('should map a template engine', (done) => {
            var app = express();

            app.set('views', path.join(__dirname, 'fixtures'))
            app.engine('.html', render);
            app.locals.user = { name: 'tobi' };

            app.render('user.html', (err, str) => {
                if (err) return done(err);
                assert.strictEqual(str, '<p>tobi</p>')
                done();
            })
        })

        it('should throw when the callback is missing', () => {
            var app = express();
            assert.throws(function () {
                app.engine('.html', null);
            }, /callback function required/)
        })

        it('should work without leading "."', (done) => {
            var app = express();

            app.set('views', path.join(__dirname, 'fixtures'))
            app.engine('html', render);
            app.locals.user = { name: 'tobi' };

            app.render('user.html', (err, str) => {
                if (err) return done(err);
                assert.strictEqual(str, '<p>tobi</p>')
                done();
            })
        })

        it('should work "view engine" setting', (done) => {
            var app = express();

            app.set('views', path.join(__dirname, 'fixtures'))
            app.engine('html', render);
            app.set('view engine', 'html');
            app.locals.user = { name: 'tobi' };

            app.render('user', (err, str) => {
                if (err) return done(err);
                assert.strictEqual(str, '<p>tobi</p>')
                done();
            })
        })

        it('should work "view engine" with leading "."', (done) => {
            var app = express();

            app.set('views', path.join(__dirname, 'fixtures'))
            app.engine('.html', render);
            app.set('view engine', '.html');
            app.locals.user = { name: 'tobi' };

            app.render('user', function (err, str) {
                if (err) return done(err);
                assert.strictEqual(str, '<p>tobi</p>')
                done();
            })
        })
    })
});
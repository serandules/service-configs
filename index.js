var log = require('logger')('service-configs');
var bodyParser = require('body-parser');

var Configs = require('model-configs');
var auth = require('auth');
var throttle = require('throttle');
var serandi = require('serandi');

var model = require('model');

var pub = require('./public');

module.exports = function (router, done) {
  pub.find(function (err, configs) {
    if (err) {
      return done(err);
    }
    var allowed = ['^\/$'];
    configs.forEach(function (config) {
      allowed.push('^\/' + config.id + '$');
    });
    router.use(serandi.many);
    router.use(serandi.ctx);
    router.use(auth({
      GET: allowed
    }));
    router.use(throttle.apis('configs'));
    router.use(bodyParser.json());

    router.get('/:id',
      serandi.id,
      serandi.findOne(Configs),
      function (req, res, next) {
        model.findOne(req.ctx, function (err, config) {
          if (err) {
            return next(err);
          }
          res.send(config);
        });
      });

    router.get('/',
      serandi.find(Configs),
      function (req, res, next) {
        model.find(req.ctx, function (err, configs, paging) {
          if (err) {
            return next(err);
          }
          res.many(configs, paging);
        });
      });

    router.post('/',
      serandi.json,
      serandi.create(Configs),
      function (req, res, next) {
        model.create(req.ctx, function (err, config) {
          if (err) {
            return next(err);
          }
          res.locate(config.id).status(201).send(config);
        });
      });

    router.post('/:id',
      serandi.id,
      serandi.json,
      serandi.transit({
        workflow: 'model',
        model: Configs
      }));

    router.put('/:id',
      serandi.id,
      serandi.json,
      serandi.update(Configs),
      function (req, res, next) {
        model.update(req.ctx, function (err, config) {
          if (err) {
            return next(err);
          }
          res.locate(config.id).status(200).send(config);
        });
      });

    done();
  });
};

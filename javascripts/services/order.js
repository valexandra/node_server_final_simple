var repositories = require('../repositories');
var _ = require('lodash');
var utils = require('../utils'),
    colors = require('colors');

function OrderService (configuration) {
  this.countries = new repositories.Countries(configuration);
}

module.exports = OrderService;

var service = OrderService.prototype;

service.sendOrder = function (seller, order, cashUpdater, logError) {
  console.info(colors.grey('Sending order ' + utils.stringify(order) + ' to seller ' + utils.stringify(seller)));
  utils.post(seller.hostname, seller.port, seller.path + '/order', order, cashUpdater, logError);
};

service.createOrder = function (reduction) {
  var items = _.random(1, 10);
  var prices = new Array(items);
  var quantities = new Array(items);
  var country = this.countries.randomOne();
  var rnd_year = _.random(2017, 2020);
  var rnd_month = _.random(1,12);
  var rnd_days = _.random(1, 30);
  var rnd_duration = _.random(3, 30);
  var startDate = new Date(rnd_year, rnd_month, rnd_days);
  var endDate = new Date();
  endDate.setTime(startDate.getTime() + rnd_duration*86400000);
  for(var item = 0; item < items; item++) {
    var price = _.random(1, 100, true);
    prices[item] = utils.fixPrecision(price, 2);
    quantities[item] = _.random(1, 10);
  }

  return {
    prices: prices,
    quantities: quantities,
    startDate: startDate,
    endDate: endDate,
    country: country,
    reduction: reduction.name
  };
};

service.bill = function (order, reduction) {
  var prices = order.prices;
  var quantities = order.quantities;
  var duration = (order.endDate.getTime() - order.startDate.getTime())/86400000;
  var sum = quantities
    .map(function(q, i) {return q * prices[i]})
    .reduce(function(sum, current) {return sum + current}, 0);

  var taxRule = this.countries.taxRule(order.country);
  console.log("Total sum :: " + sum);
  sum = taxRule.applyTax(sum);
  console.log("Total sum after taxes :: " + sum + "Country : " + order.country);
  sum = reduction.apply(sum);
  console.log("Total sum after reduction :: " + sum );
  sum = sum*duration;
  console.log("Total sum :: " + sum/100);
  return { total: sum/100 };
};

service.validateBill = function (bill) {
  if(!_.has(bill, 'total')) {
    throw {message: 'The field \"total\" in the response is missing.'};
  }

  if(!_.isNumber(bill.total)) {
    throw {message: '\"Total\" is not a number.'};
  }
}

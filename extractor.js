;(function($, undefined) {

  // The https://riders.uber.com/trips scraper specification
  var scraper = {
    iterator: '.hard .palm-one-whole',
    data: {
      date: function($) { return $(this).closest('tr').prev().find('td:nth-child(2)').text().substring(0,8); },
      cab: function($) { return 'Cab'; },
      uber: function($) { return 'Uber'; },
      date2: function($) { return $(this).closest('tr').prev().find('td:nth-child(2)').text().substring(0,8); },
      cost: function($) { 
        var number = $(this).closest('tr').prev().find('td:nth-child(4)').text();
        if(number) {
          number = number.split(',').join('');
        }
        if (!number || !number.match(/\d+(.\d+)?/g) || !number.match(/\d+(.\d+)?/g).map(Number)) {
          number = '';
        }
        else {
          number = number.match(/\d+(.\d+)?/g).map(Number)[0];
        }
        return number;
      },
    },
    params: {
      done: function(data){
        var trip_list = data.filter(function(element) {
          return element.cost;
        });
        artoo.s.pushTo('trip_list', trip_list);
      }
    } 
  };

  // Handle pagination
  function nextUrl($page) {
    return $page.find('.pagination__next').attr('href');
  }

  // Start the scraper
  artoo.log.debug('Starting the scraper...');
  var ui = new artoo.ui();
  ui.$().append('<div style="position:fixed; top:35px; left:25px; background-color: #000; color: #FFF; z-index:1000">Scraping in progress... this may take a few minutes! DO NOT CLICK THE EXTENSION AGAIN!</div>');
  var uber = artoo.scrape(scraper);

  // Launch the spider
  artoo.ajaxSpider(
    function(i, $data) {
      return nextUrl(!i ? artoo.$(document) : $data);
    },
    {
      limit: 250,
      throttle: 5000,
      scrape: scraper,
      concat: false,
      done: function(data) {
        artoo.log.debug('Finished retrieving data. Downloading...');
        ui.kill();
        artoo.saveCsv([].concat.apply([], artoo.s.get('trip_list')), {
            filename: 'trip-history.csv'
          });
          artoo.s.remove('trip_list');          
      },
      settings: {
        error: function (request, status, error) {
          ui.kill();
          artoo.saveCsv([].concat.apply([], artoo.s.get('trip_list')), {
              filename: 'trip-history.csv'
            });
            artoo.s.remove('trip_list');          
          }
      }
    });
}).call(this, artoo.$);
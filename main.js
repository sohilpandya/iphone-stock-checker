
var https = require('https');
var notifier = require('node-notifier');
var Repeat = require('repeat');

var storesUrl = 'https://reserve.cdn-apple.com/GB/en_GB/reserve/iPhone/stores.json';
var stockUrl = 'https://reserve.cdn-apple.com/GB/en_GB/reserve/iPhone/availability.json';

var stockLastUpdated;

var stores;
var stock;
var storeNameMap = {};

Repeat(checkStock).every(2, 'minutes').start.now();


function checkStock() {
	console.log("Checking stock in the London stores...")

	https.get(storesUrl, function(res) {
		var body = '';
		res.on('data', function(chunk) {
			body += chunk;
		});
		res.on('end', function() {
			stores = JSON.parse(body).stores;
			listAvailableStock();
		});
	}).on('error', function(e) {
		  console.log("Got error for URL "+storesUrl+" : ", e);
	});

	https.get(stockUrl, function(res) {
		var body = '';
		res.on('data', function(chunk) {
			body += chunk;
		});
		res.on('end', function() {
			stock = JSON.parse(body);
			stockLastUpdated = new Date(res.headers["last-modified"]);
			delete stock.updated;
			listAvailableStock();
		});
	}).on('error', function(e) {
		console.log("Got error for URL "+storesUrl+" : ", e);
	});
};

function listAvailableStock() {


	if (stores != null && stock != null) {

		for (var i in stores) {
			var store = stores[i];
			var storeName = store.storeName;
			var storeNumber = store.storeNumber;
			storeNameMap[storeNumber] = storeName;
		}

		var foundStock = false;

		for (var storeNumber in stock) {
			var stockEntry = stock[storeNumber];
			var storeName = storeNameMap[storeNumber];

			// opt filter by store
			if ((storeName == "Brent Cross") || (storeName ==  "Stratford City") || (storeName == "White City") || (storeName == "Covent Garden") || (storeName ==  "Watford"))
			{
				for (var product in stockEntry) {
					// opt filter by model, finish, storage
					if ((product == 'MN4M2B/A'))
					{ //Black 7 Plus 128GB


						if (stockEntry[product] == 'ALL') {
							foundStock = true;

							console.log("\t *** " + storeName + " has stock of " + product + "! ***");
							notifier.notify({
								title: 'Stock found!',
								message: storeName + " has stock of " + product,
								open: "https://reserve-gb.apple.com/GB/en_GB/reserve/iPhone?execution=e2s1"
							});
							break;
						}
					}
				}
			}
		}

		console.log("Last updated: " + stockLastUpdated.getHours()+":"+stockLastUpdated.getMinutes());
	}
}

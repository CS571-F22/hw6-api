CREATE TABLE IF NOT EXISTS BadgerBakeryOrder (
	id INTEGER PRIMARY KEY,
	username TEXT NOT NULL,
	numMuffin INTEGER NOT NULL,
	numDonut INTEGER NOT NULL,
	numPie INTEGER NOT NULL,
	placedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

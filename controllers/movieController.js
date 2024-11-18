const mysql = require("mysql2");
const dbInfo = require("../../../vp2024config");

const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});

const movieHome = (req, res)=>{
	res.render("eestifilm");
};


const movieCharacters = (req, res)=>{
	let sqlReq = "SELECT id, first_name, last_name, birth_date FROM person";
	conn.query(sqlReq, (err, sqlRes)=>{
		if(err){
			res.render("tegelased", {persons: {first_name: "Ei", last_name: "leidnud", birth_date: "VIGA"}});
		}
		else {
			res.render("tegelased", {persons: sqlRes});
		}
	});
};

const movieList = (req, res)=>{
	let sqlReq = "SELECT title, production_year, duration FROM movie";
	conn.query(sqlReq, (err, sqlRes)=>{
		if(err){
			throw err;
		}
		else {
			res.render("filmid", {movies: sqlRes});
		}
	});	
}	;

const movieRelations = (req, res)=>{
	const myQueries = [
		function(callback){
			conn.execute(("SELECT id, first_name, last_name, birth_date FROM person"), (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},
		function(callback){
			conn.execute(("SELECT id, title, production_year FROM movie"), (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},
	];
	asyn.parallel(myQueries, (err, results)=>{
		if(err){
			throw err;
		}
		else {
			console.log(results);
			res.render("addrelations", {personList: results[0]});
		}
	});

};


module.exports = {
	movieHome,
	movieCharacters,
	movieList,
	movieRelations
};
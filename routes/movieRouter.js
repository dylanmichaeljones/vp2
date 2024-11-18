const express = require("express");
const router = express.Router();
const general = require("../generalFnc");
const {movieHome,
	movieCharacters,
	movieList,
	movieRelations} = require("../controllers/movieController");

router.use(general.checkLogin);


router.route("/").get(movieHome);

router.route("/tegelased").get(movieCharacters);

router.route("/filmid").get(movieList);


module.exports = router;

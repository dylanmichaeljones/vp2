const express = require("express");
const router = express.Router(); //suur "R" on oluline!!!
const general = require("../generalFnc");
const {newsHome,
	addNews,
	addingNews,
	newsList} = require("../controllers/newsController");


//k6ikidele marsruutidele vahevara checkLogin
router.use(general.checkLogin);

//marsruudid
//kuna k6ik on nagunii "/news", siis  lihtsalt "/"
//kuna tahame kasutada ka kontrollereid, siis .get tuleb j2rgi
//router.route("/").get((req, res)=>{
router.route("/").get(newsHome);

router.route("/add").get(addNews);

router.route("/add").post(addingNews);

router.route("/read").get(newsList);

module.exports = router;
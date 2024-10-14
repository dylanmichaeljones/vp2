const weekDayNamesEt = ["pühapäev", "esmaspäev", "teisipäev", "kolmapäev", "neljapäev", "reede", "laupäev"];
const monthNamesEt = ["jaanuar", "veebruar", "märts", "aprill", "mai", "juuni", "juuli", "august", "september", "oktoober", "november", "detsember"];

const dateFormattedEt = function(){
	let timeNow = new Date();
	let dateNow = timeNow.getDate();
	let monthNow = timeNow.getMonth();
	let yearNow = timeNow.getFullYear();
	return dateNow + ". " + monthNamesEt[monthNow] + " " + yearNow;
};

const weekDayEt = function(){
	let timeNow = new Date();
	let weekDayNow = timeNow.getDay();
	return weekDayNamesEt[weekDayNow];
};

const timeFormattedEt = function(){
	let timeNow = new Date();
	let hoursNow = timeNow.getHours();
	let minutesNow = timeNow.getMinutes();
	let secondsNow = timeNow.getSeconds();
	let timeEt = hoursNow + ":" + minutesNow + ":" + secondsNow;
	return timeEt	
};

/*const partOfDay = function(){
	let dPart = "suvaline aeg";
	let hourNow = new Date().getHours();
	if(weekDayNow = "esmaspäev"){
		if(hourNow > 8 && hourNow <= 16){
		dPart = "Kooliaeg!";
	} else if(hourNow > 16 && hourNow <= 0o0){
		dPart = "Kool läbi tänaseks :(";
	}
}
	if(weekDayNow = "teisipäev"){
		if(hourNow > 10 && hourNow <= 12){
		dPart = "Kooliaeg!";
	} else if(hourNow > 12 && hourNow <= 0o0){
		dPart = "Kool läbi tänaseks :(";
	}
}
	if(weekDayNow ="kolmapäev"){
		if(hourNow > 8 && hourNow <= 14){
			dPart = "Kooliaeg!";
	} else if(hourNow > 14 && hourNow <= 0o0){
		dPart = "Kool läbi tänaseks :(";
	}
}
	if(weekDayNow = "neljapäev"){
		if(hourNow > 10 && hourNow <= 12){
			dPart = "Kooliaeg!";
	} else if(hourNow > 12 && hourNow <= 0o0){
			dPart = "Kool läbi tänaseks :(";
	}
}
	if(weekDayNow = "reede"){
		dPart = "Täna pole kooli, tee midagi toredat!";
}
	if(weekDayNow = "pühapäev, laupäev"){
		return "Jee, nädalavahetus, jõuab palju õppida!";
}
	if(hourNow >0o0 && hourNow <= 7){
		dPart = "Tuduaeg, ilusaid unenägusid!";
}
return dPart;
}
*/
//console.log(partOfDay());

//ekspordin kõik vajaliku
module.exports = {dateFormattedEt: dateFormattedEt, weekDayEt: weekDayEt, timeFormattedEt: timeFormattedEt, weekDayNamesEt: weekDayNamesEt, monthNamesEt: monthNamesEt};
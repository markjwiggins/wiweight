function calculateWeightChangePerWeek(startdate, startweight, currentweight) {
	var today = moment(),
		weeks = today.diff(startdate, 'days') / 7;
	return ((startweight - currentweight) / weeks).toFixed(1);
}

function calculateTotalWeightDelta(startdate, weights) {
	var startweight = weights[startdate.format("DD-MMM-YYYY")],
		endWeight = getLatestWeight(weights);

	return (endWeight - startweight).toFixed(1);
}

function calculateRemainingWeight(weights, goalweight) {
	var endweight = getLatestWeight(weights);
	return (goalweight - endweight).toFixed(1);
}

function calculateDaysToGoal(startweight, goalweight, caloriedeficit) {
  var weight2loose = (startweight - goalweight),
      lossperweek = ((7 * caloriedeficit) / 3500),
      weeks2goal = (weight2loose / lossperweek),
      days2goal = (weeks2goal * 7);
  
	return days2goal;
}

function calculateGoalDate(startdate, startweight, goalweight, caloriedeficit) {
	var daystogoal = calculateDaysToGoal(startweight, goalweight, caloriedeficit),
		  date = startdate.clone().add(daystogoal, 'days').format('DD-MMM-YYYY');
	return date;
}

function kg2lbs(kg) {
	return parseFloat(kg * 2.2046226218).toFixed(1);
}

function calculateAge(dob) {
	return moment().diff(moment(dob), 'years');
}

function calculateBMI(weight, height) {
	return (((weight / (height * height)) * 703).toFixed(1));
}

function calculateTDEE(gender, height, weight, age, activity) {
	var activityFactor = getActivityFactor(activity),
		tdee = 0;

	// calculate tdee
	switch (gender) {
	case 'Male':
		tdee = ((66 + (6.23 * weight) + (12.7 * height) - (6.8 * age)) * activityFactor);
		break;

	case 'Female':
		tdee = ((655 + (4.35 * weight) + (4.7 * height) - (4.7 * age)) * activityFactor);
		break;

	}

	return tdee.toFixed(0);
}

function calculateDailyDeficit(startDate, endDate, weights) {

	var daysinmonth = moment().daysInMonth(),
	    loss = (getEarliestWeight(weights) - getLatestWeight(weights)),
		  weeks = (endDate.diff(startDate, 'days') / 7);

	var deficit = (((loss) * 3500) / Object.keys(weights).length);

	return deficit.toFixed(0);
}

function calculateWeeklyDeficit(startDate, endDate, weights) {
	var daily = calculateDailyDeficit(startDate, endDate, weights);

	return (daily * 7).toFixed(0);
}

function calculateSmoothAvg(weights) {
  var smoothAvg = [],
      prev = 0;
  
  	for (var i = 0; i < weights.length; i++) {
  	  if (i === 0) {
  	    prev = weights[i];
  	    smoothAvg.push(prev.toFixed(1));
  	    continue;
  	  }
  	  
  	  prev = prev + ((1 - 0.9) * (weights[i] - prev));
  	  smoothAvg.push(prev.toFixed(1));
  	  
  	}
  	
  return smoothAvg;

}

function getActivityFactor(activityType) {
	var factor = 0;

	switch (activityType) {
	case 'Sedentary':
		factor = 1.2;
		break;
	case 'Lightly Active':
		factor = 1.375;
		break;
	case 'Moderately Active':
		factor = 1.55;
		break;
	case 'Very Active':
		factor = 1.725;
		break;
	case 'Extremely Active':
		factor = 1.9;
		break;
	}

	return factor;
}

function getLatestWeight(weights) {
	// calculate latest weight
	var dates = [];
	for (var i in weights) {
		dates.push(moment(i, "DD-MMM-YYYY", true));
	}

	var max = moment.max(dates).format("DD-MMM-YYYY");
	return weights[max];
}

function getEarliestWeight(weights) {
	// calculate earliest weight
	var dates = [];
	for (var i in weights) {
		dates.push(moment(i, "DD-MMM-YYYY", true));
	}

	var min = moment.min(dates).format("DD-MMM-YYYY");
	return weights[min];
}

function getLatestDate(weights) {
	// calculate earliest date
	var dates = [];
	for (var i in weights) {
		dates.push(moment(i, "DD-MMM-YYYY", true));
	}

	var min = moment.max(dates);
	return min;
}

function getEarliestDate(weights) {
	// calculate earliest date
	var dates = [];
	for (var i in weights) {
		dates.push(moment(i, "DD-MMM-YYYY", true));
	}

	var min = moment.min(dates);
	return min;
}

function findStartDate(override, weights) {
	if (!override) {
		return getEarliestDate(weights);
	} else {
		return moment(override, "DD-MMM-YYYY");
	}
}

function findStartWeight(override, weights) {
	if (!override) {
		return getEarliestWeight(weights);
	} else {
		return weights[moment(override, "DD-MMM-YYYY")];
	}
}

function findCurrentSmoothAvg(startdate, weights) {
	var today = moment(),
		daysDiff = (today.diff(startdate, 'days'));

	// calculate date labels
	var labels = createDateArray(startdate, daysDiff);

	// align weights to dates
	weights = alignWeights2Dates(labels, weights);

	var seven = calculateSmoothAvg(weights);
	return seven[seven.length - 1];
}
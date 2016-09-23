$(function() {
  $.getJSON( "data.json", function(data) {

    var weights = data.weights,
        dob = moment(data.dob, "DD-MMM-YYYY"),
        age = calculateAge(dob),
        gender = data.gender,
        height = parseInt(data.height),
        startdate = findStartDate(data.startdate, weights),
        startweight = findStartWeight(data.startdate, weights),
        currentweight = getLatestWeight(weights),
        goalweight = parseInt(data.goalweight),
        activityfactor = data.activityfactor,
        lbsperweek = parseInt(data.lbsperweek),
        current7day = findCurrent7Day(startdate, weights);
    
    setDefaultValues(startdate, startweight, goalweight, gender, height, dob, age, activityfactor, lbsperweek);
    
    $('#weight-delta').text(calculateTotalWeightDelta(startdate, weights));
    $('#remaining').text(calculateRemainingWeight(weights, goalweight));
    $('#original-bmr').text(calculateBMR(gender, height, startweight, age, activityfactor));
    $('#current-bmr').text(calculateBMR(gender, height, currentweight, age, activityfactor));
    $('#daily-calorie-deficit').text(calculateDailyDeficit(startdate, moment(), startweight, currentweight));
    $('#weekly-calorie-deficit').text(calculateWeeklyDeficit(startdate, moment(), startweight, currentweight));
    $('#original-goal-date').text(calculateGoalDate(startdate, startweight, goalweight, lbsperweek));
    $('#current-goal-date').text(calculateGoalDate(startdate, current7day, goalweight, lbsperweek));
    $('#current-weight').text(currentweight);
    $('#seven-day-weight').text(current7day);
    
    drawGraph(weights, height, goalweight);
    
    // console.log(dob);
    // console.log(gender);
    // console.log(height);
    // console.log(startdate);
    // console.log(goalweight);
    // console.log(activityfactor);
    // console.log(weights);

  });
});

function calculateTotalWeightDelta(startdate, weights) {
    var startweight = weights[startdate.format("DD-MMM-YYYY")],
        endWeight = getLatestWeight(weights);
    
    return (endWeight - startweight).toFixed(1);
}

function calculateRemainingWeight(weights, goalweight) {
  var endweight = getLatestWeight(weights);
  return (goalweight - endweight).toFixed(1);
}

function calculateDaysToGoal(startweight, goalweight, lbsperweek) {
  return (((startweight - goalweight) / lbsperweek) * 7 );
}

function calculateGoalDate(startdate, startweight, goalweight, lbsperweek) {
  var daystogoal = calculateDaysToGoal(startweight, goalweight, lbsperweek),
      date = startdate.clone().add(daystogoal, 'days').format('DD-MMM-YYYY');
  return date;
}

function setDefaultValues(startdate, startweight, goalweight, gender, height, dob, age, activityfactor, lbsperweek) {
  $('#start-date').val(startdate.format('YYYY-MM-DD'));
  $('#start-weight').val(startweight);
  $('#goal-weight').val(goalweight);
  $('#gender option[value=' + gender + ']').attr('selected','selected');
  $('#height').val(height);
  $('#dob').val(dob.format('YYYY-MM-DD'));
  $('#age').val(age);
  $('#activity-level option[value="' + activityfactor + '"]').attr('selected','selected');
  $('#loss-per-week option[value="' + lbsperweek + '"]').attr('selected','selected');
}

function drawGraph(actualWeights, height, goalWeight) {
		var startDate = moment($('#start-date').val()),
		    today = moment(),
			  daysDiff = (today.diff(startDate, 'days'));
			
		var bmi = [],
  			goal = [];

		// calculate date labels
		var labels = createDateArray(startDate, daysDiff);

    // align weights to dates
    var weights = alignWeights2Dates(labels, actualWeights);

		// calculate three day rolling
		var rollAvg3 = calculate3DayAvg(weights);

		// calculate ten day rolling
		var rollAvg7 = calculate7DayAvg(weights);
		
		// set goal weight line
		for (var i = 0; i < weights.length; i++) {
		  goal.push(goalWeight);
		}
		
		// calculate BMI
		for (var i = 0; i < weights.length; i++) {
			bmi.push(calculateBMI(weights[i], height));
		}

		var data = {
			labels: labels,
			datasets: [
				{
					label: "Actual Weight",
					type: 'line',
					yAxisID: 'y-axis-0',
					borderWidth: 1,
					fill: false,
					borderColor: "rgba(70, 191, 189, 0.2)",
          pointBackgroundColor: "#46BFBD",
          pointBorderWidth: 1,
          pointHoverRadius: 5,
					data: weights,
        },
				{
					label: "7-Day Rolling Average",
					fill: false,
					type: 'line',
					yAxisID: 'y-axis-0',
					borderWidth: 2,
					borderColor: "#FDB45C",
          pointBackgroundColor: "#FDB45C",
          pointBorderWidth: 1,
          pointHoverRadius: 5,
					data: rollAvg7,
        },
        {
					label: "BMI",
					type: 'bar',
					yAxisID: 'y-axis-1',
					fill: true,
					backgroundColor: "rgba(255, 0, 0, 0.1)",
					data: bmi,
        },
        {
					label: "Goal",
					type: 'line',
					fill: false,
					yAxisID: 'y-axis-0',
					borderColor: "green",
					borderWidth: 1,
					pointRadius: 0,
					data: goal,
					borderDash : [10, 5]
        }
    ]
		};

		var options = {
			legend: {
				display: false,
			},
			scales: {
            yAxes: [
              {
                ticks: {
                    min: (goalWeight - 5),
                },
                id: 'y-axis-0',
                position: 'left',
                scaleLabel: {
                  display: 'true',
                  labelString: 'lbs'
                }
                
              },
              {
                ticks: {
                    min: (Math.floor(Math.min.apply(null, bmi) - 1)),
                },
                id: 'y-axis-1',
                position: 'right',
                gridLines: {
                  drawOnChartArea: false,
                },
                scaleLabel: {
                  display: 'true',
                  labelString: 'BMI'
                }
              }
            ],
            xAxes: [
              {
                  display: false
              }
            ],
        },
        tooltips: {
          mode: 'x-axis'
        }
		}

		var ctx = document.getElementById("analysis-chart");
		var myLineChart = new Chart(ctx, {
			type: 'bar',
			data: data,
			options: options
		});
}

function recalculate(weights, goal) {
  var gender = $('#gender').val(),
      height = $('#height').val(),
      age = $('#age').val(),
      activityLevel = $('#activity-level').val(),
      currentWeight = getLatestWeight(weights),
      startingWeight = getEarliestWeight(weights),
      goalWeight = goal,
      startDate = moment($('#start-date').val()),
      perWeek = $('#loss-per-week').val();
  
  $('#original-bmr-result').text(calculateBMR(gender, height, startingWeight, age, activityLevel));
  $('#current-bmr-result').text(calculateBMR(gender, height, currentWeight, age, activityLevel));
  
  $('#total-loss').text((startingWeight - currentWeight).toFixed(1));
  
  $('#remaining').text((currentWeight - goalWeight).toFixed(1));
  
  var originalDaysToGoal = (((startingWeight - goalWeight) / perWeek) * 7 ),
      
      currentDaysToGoal = (((currentWeight - goalWeight) / perWeek) * 7 );
  
  $('#original-goal-date').text(startDate.clone().add(originalDaysToGoal, 'days').format('DD-MMM-YYYY'));
  
  $('#current-goal-date').text(startDate.clone().add(currentDaysToGoal, 'days').format('DD-MMM-YYYY'));
  
  $('#daily-calorie-deficit').text(calculateDailyDeficit(startDate, moment().format('DD-MM-YYYY'), startingWeight, currentWeight));
  
  $('#weekly-calorie-deficit').text(calculateWeeklyDeficit(startDate, moment().format('DD-MM-YYYY'), startingWeight, currentWeight));
  
  window.scrollTo(0, 0);
}

function kg2lbs(kg) {
  return parseInt(kg * 2.2046226218).toFixed(1);
}

function calculateAge(dob) {
  return moment().diff(moment(dob), 'years');
}

function alignWeights2Dates(dates, actualWeights) {
  // align weights to dates
  var weights = [];
  
  for (var i = 0; i < dates.length; i++) {
    if (dates[i] in actualWeights) {
      weights.push(actualWeights[dates[i]]);
    } else {
      if (i > 0) {
        weights.push(weights[i - 1]);
      } else {
        weights.push(0);
      }
    }
  }
  
  return weights;
}

function createDateArray(start, days) {
  var dates = [];
  
	// calculate date labels
	for (var i = 0; i <= days; i++) {
		dates.push(start.clone().add(i, 'days').format('DD-MMM-YYYY'));
	}
	
	return dates;
}

function calculateBMI(weight, height) {
  return (((weight / (height * height)) * 703).toFixed(1));
}

function calculateBMR(gender, height, weight, age, activity) {
  var activityFactor = getActivityFactor(activity),
      bmr = 0;
  
  // calculate bmr
  switch (gender) {
    case 'Male':
      bmr = ((66 + (6.23 * weight) + (12.7 * height) - (6.8 * age)) * activityFactor);
      break;
      
    case 'Female':
      bmr = ((655 + (4.35 * weight) + (4.7 * height) - (4.7 * age)) * activityFactor);
      break;
      
  }
  
  return bmr.toFixed(0);
}

function calculateDailyDeficit(startDate, endDate, startWeight, currentWeight) {
  
  var loss = (startWeight - currentWeight),
      weeks = (endDate.diff(startDate, 'days') / 7);
      
  var deficit = (loss / weeks) * 500;

  return deficit.toFixed(0);
}

function calculateWeeklyDeficit(startDate, endDate, startWeight, currentWeight) {
  var daily = calculateDailyDeficit(startDate, endDate, startWeight, currentWeight);

  return (daily * 7).toFixed(0);
}

function calculate7DayAvg(weights) {
  var rollAvg7 = [];
		// calculate ten day rolling
	for (var i = 0; i < weights.length; i++) {
		if (i > 8) {
			rollAvg7.push(((parseInt(weights[i]) +
				parseInt(weights[i - 1]) +
				parseInt(weights[i - 2]) +
				parseInt(weights[i - 3]) +
				parseInt(weights[i - 4]) +
				parseInt(weights[i - 5]) +
				parseInt(weights[i - 6])) / 7).toFixed(1));
		} else {
			rollAvg7.push(weights[i]);
		}
	}
		
	return rollAvg7;
  
}

function calculate3DayAvg(weights) {
  var rollAvg3 = [];
  
	for (var i = 0; i < weights.length; i++) {
		if (i > 1) {
			rollAvg3.push(((parseInt(weights[i]) + parseInt(weights[i - 1]) + parseInt(weights[i - 2])) / 3).toFixed(1));
		} else {
			rollAvg3.push(weights[i]);
		}
	}
	
	return rollAvg3;
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

function findCurrent7Day(startdate, weights) {
  var today = moment(),
			daysDiff = (today.diff(startdate, 'days'));
			
  // calculate date labels
	var labels = createDateArray(startdate, daysDiff);

  // align weights to dates
  weights = alignWeights2Dates(labels, weights);
  
  var seven = calculate7DayAvg(weights);
  console.log(weights);
  return seven[seven.length - 1];
}
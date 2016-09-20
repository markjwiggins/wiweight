$(function() {
  $.getJSON( "weights.json", function(data) {
    // fitbit api request format
    // https://api.fitbit.com/1/user/-/body/log/weight/date/2016-09-06/2016-09-17.json
    // Ref: https://dev.fitbit.com/docs/body/
    
    var weights = data.weights,
        goal = data.goal,
        age = $('#age'),
        dob = $('#dob'),
        height = $('#height').val(),
        dobVal = moment($('#dob').val()),
        today = moment();
        
    age.val(today.diff(dobVal, 'years'));
    
    dob.blur(function() { age.val(today.diff(dob.val(), 'years')); });
    
    //weights = fitbit2Weights(fitbitResponse);
    drawGraph(weights, height, goal);
    
    recalculate(weights, goal);
    
    $('#recalculate').click(function() {
      recalculate(weights, goal);
      return false;
    });
  });
});

function fitbit2Weights(fbResponse) {
  var weights = fbResponse.weight,
  rtn = {};
  
  for (var i = 0; i < weights.length; i++) {
    var weight = weights[i],
        date = moment(weight.date, "YYYY-MM-DD", true).format('DD-MMM-YYYY');
    rtn[date] = kg2lbs(weight.weight);
  }
  
  return rtn;
}

function drawGraph(actualWeights, height, goalWeight) {
		var labels = [],
			startDate = moment($('#start-date').val()),
			today = moment(),
			daysDiff = (today.diff(startDate, 'days'));
			
		var rollAvg3 = [],
			rollAvg10 = [],
			bmi = [],
			goal = [];

		// calculate date labels
		for (var i = 0; i <= daysDiff; i++) {
			labels.push(startDate.clone().add(i, 'days').format('DD-MMM-YYYY'));
		}

    // align weights to dates
    var weights = [];
    
    for (var i = 0; i < labels.length; i++) {
      if (labels[i] in actualWeights) {
        weights.push(actualWeights[labels[i]]);
      } else {
        if (i > 0) {
          weights.push(weights[i - 1]);
        } else {
          weights.push(0);
        }
      }
    }
    

		// calculate three day rolling
		for (var i = 0; i < weights.length; i++) {
			if (i > 1) {
				rollAvg3.push(((parseInt(weights[i]) + parseInt(weights[i - 1]) + parseInt(weights[i - 2])) / 3).toFixed(1));
			} else {
				rollAvg3.push(weights[i]);
			}
		}

		// calculate ten day rolling
		for (var i = 0; i < weights.length; i++) {
			if (i > 8) {
				rollAvg10.push(((parseInt(weights[i]) +
  				parseInt(weights[i - 1]) +
  				parseInt(weights[i - 2]) +
  				parseInt(weights[i - 3]) +
  				parseInt(weights[i - 4]) +
  				parseInt(weights[i - 5]) +
  				parseInt(weights[i - 6]) +
  				parseInt(weights[i - 7]) +
  				parseInt(weights[i - 8]) +
  				parseInt(weights[i - 9])) / 10).toFixed(1));
			} else {
				rollAvg10.push(weights[i]);
			}
		}
		
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
					fill: false,
					borderColor: "#46BFBD",
            pointBackgroundColor: "#46BFBD",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
					data: weights,
        },
				{
					label: "3-Day Rolling Average",
					fill: false,
					type: 'line',
					yAxisID: 'y-axis-0',
					borderColor: "#F7464A",
            pointBackgroundColor: "#F7464A",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
					data: rollAvg3,
        },
				{
					label: "10-Day Rolling Average",
					fill: false,
					type: 'line',
					yAxisID: 'y-axis-0',
					borderColor: "#FDB45C",
            pointBackgroundColor: "#FDB45C",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
					data: rollAvg10,
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
					pointRadius: 1,
					data: goal,
					borderDash : [10, 5]
        }
    ]
		};

		var options = {
			legend: {
				display: true,
				position: 'bottom'
			},
			scales: {
            yAxes: [{
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
            }]
        },
        tooltips: {
          mode: 'x-axis'
        }
		}

		var ctx = document.getElementById("myChart");
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

function calculateBMI(weight, height) {
  return (((weight / (height * height)) * 703).toFixed(1));
}

function calculateBMR(gender, height, weight, age, activity) {
  var activityFactor = getActivityFactor(activity);
  
  var bmr = 0;
  
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
  startDate = moment(startDate);
  endDate = moment(endDate, 'DD-MM-YYYY');
  
  var loss = (startWeight - currentWeight),
      weeks = (endDate.diff(startDate, 'days') / 7);
      
  var deficit = (loss / weeks) * 500;

  return deficit.toFixed(0);
}

function calculateWeeklyDeficit(startDate, endDate, startWeight, currentWeight) {
  var daily = calculateDailyDeficit(startDate, endDate, startWeight, currentWeight);

  return (daily * 7).toFixed(0);
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
  // calculate latest weight
    var dates = [];
    for (var i in weights) {
      dates.push(moment(i, "DD-MMM-YYYY", true));
    }
    
    var min = moment.min(dates).format("DD-MMM-YYYY");
    return weights[min];
}

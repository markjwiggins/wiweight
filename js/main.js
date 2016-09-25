$(function () {
	$.getJSON("data.json", function (data) {
  
		var weights = data.weights,
			dob = moment(data.dob, "DD-MMM-YYYY"),
			age = calculateAge(dob),
			gender = data.gender,
			height = parseFloat(data.height),
			startdate = findStartDate(data.startdate, weights),
			startweight = findStartWeight(data.startdate, weights),
			goalweight = parseFloat(data.goalweight),
			activityfactor = data.activityfactor,
			lbsperweek = parseFloat(data.lbsperweek),
			days2goal = calculateDaysToGoal(startweight, goalweight, (lbsperweek * 500));

		setDefaultValues(startdate, startweight, goalweight, gender, height, dob, age, activityfactor, lbsperweek);

    calculate(weights, age, gender, height, activityfactor, startdate, startweight, goalweight, lbsperweek);

		drawGraph(startdate, weights, height, goalweight, days2goal);

	});
	
	$('#recalculate').click(function() {
	  var details = $('#details').serializeArray();
    $.ajax({
      type: "POST",
      url: "test.php",
      datatype: "html",
      cache: false,
      data:  details,
      success: function(data) {
        //console.log($.parseJSON(data));
        console.log(data);
      }
    });
    return false;
	});
});

function setDefaultValues(startdate, startweight, goalweight, gender, height, dob, age, activityfactor, lbsperweek) {
	$('[name=start-date]').val(startdate.format('YYYY-MM-DD'));
	$('[name=start-weight]').val(startweight);
	$('[name=goal-weight]').val(goalweight);
	$('[name=gender] option[value=' + gender + ']').attr('selected', 'selected');
	$('[name=height]').val(height);
	$('[name=dob]').val(dob.format('YYYY-MM-DD'));
	$('[name=age]').val(age);
	$('[name=activity-level] option[value="' + activityfactor + '"]').attr('selected', 'selected');
	$('[name=loss-per-week] option[value="' + lbsperweek + '"]').attr('selected', 'selected');
}

function drawGraph(startDate, actualWeights, height, goalWeight, days2goal) {
	var startweight = findStartWeight(false, actualWeights),
		  today = moment(),
		  daysDiff = (today.diff(startDate, 'days'));

	var bmi = [],
		goal = [],
		forecast = [];

	// calculate date labels
	var labels = createDateArray(startDate, daysDiff);

	// align weights to dates
	var weights = alignWeights2Dates(labels, actualWeights);

	// calculate ten day rolling
	var smoothAvg = calculateSmoothAvg(weights);

	// set goal weight line
	for (var i = 0; i < weights.length; i++) {
		goal.push(goalWeight);
	}
	
	// set forecast weight line
	var subtract = ((startweight - goalWeight) / days2goal);
	for (i = 0; i < weights.length; i++) {
	  if (i === 0) {
	    forecast.push(startweight)
	  } else {
  		forecast.push((forecast[i - 1] - subtract).toFixed(1));
	  }
	}

	// calculate BMI
	for (i = 0; i < weights.length; i++) {
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
				label: "Smoothed Average",
				fill: false,
				type: 'line',
				yAxisID: 'y-axis-0',
				borderWidth: 2,
				borderColor: "#FDB45C",
				pointBackgroundColor: "#FDB45C",
				pointBorderWidth: 1,
				pointHoverRadius: 5,
				data: smoothAvg,
        },
      {
				label: "Goal Trend",
				fill: false,
				type: 'line',
				yAxisID: 'y-axis-0',
				borderWidth: 2,
				borderColor: "rgba(0, 255, 0, 0.5)",
				pointBackgroundColor: "#FDB45C",
				pointBorderWidth: 0,
				pointRadius: 0,
				borderDash: [10, 5],
				data: forecast,
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
				borderColor: "rgba(0, 255, 0, 0.5)",
				borderWidth: 1,
				pointRadius: 0,
				data: goal,
				borderDash: [10, 5]
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

function calculate(weights, age, gender, height, activityfactor, startdate, startweight, goalweight, lbsperweek) {
  
  var currentweight = getLatestWeight(weights),
			currentSmoothAvg = findCurrentSmoothAvg(startdate, weights),
			bmi = calculateBMI(currentweight, height),
			caloriedeficit = calculateDailyDeficit(startdate, moment(), weights);
  
		$('#weight-delta').text(calculateTotalWeightDelta(startdate, weights));
		$('#remaining').text(calculateRemainingWeight(weights, goalweight));
		$('#original-tdee').text(calculateTDEE(gender, height, startweight, age, activityfactor));
		$('#current-tdee').text(calculateTDEE(gender, height, currentweight, age, activityfactor));
		$('#daily-calorie-deficit').text(caloriedeficit);
		$('#current-bmi').text(bmi);
		$('#original-goal-date').text(calculateGoalDate(startdate, startweight, goalweight, (lbsperweek * 500)));
		$('#current-goal-date').text(calculateGoalDate(moment(), currentSmoothAvg, goalweight, caloriedeficit));
		$('#current-weight').text(currentweight);
		$('#smooth-avg-weight').text(currentSmoothAvg);
		$('#change-per-week').text(calculateWeightChangePerWeek(startdate, startweight, currentweight));

		// evaluate and color based on status
		if (currentweight > (goalweight + 5)) {
			$('#current-weight').addClass('text-danger');
		}
		if (currentweight > goalweight && currentweight <= (goalweight + 5)) {
			$('#current-weight').addClass('text-warning');
		}
		if (currentweight <= goalweight) {
			$('#current-weight').addClass('text-success');
		}

		if (currentSmoothAvg > goalweight) {
			$('#smooth-avg-weight').addClass('text-danger');
		}
		if (currentSmoothAvg > goalweight && currentSmoothAvg <= (goalweight + 5)) {
			$('#smooth-avg-weight').addClass('text-warning');
		}
		if (currentSmoothAvg <= goalweight) {
			$('#smooth-avg-weight').addClass('text-success');
		}

		if (bmi < 18.5) {
			$('#current-bmi').addClass('text-error');
		}
		if (bmi >= 18.5 && bmi < 25) {
			$('#current-bmi').addClass('text-success');
		}
		if (bmi >= 25 && bmi < 30) {
			$('#current-bmi').addClass('text-warning');
		}
		if (bmi >= 30) {
			$('#current-bmi').addClass('text-error');
		}

	window.scrollTo(0, 0);
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

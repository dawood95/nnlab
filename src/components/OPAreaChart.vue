<template>
   <div>
     <apexcharts :height="height" type="area" :options="chartOptions" :series="series"></apexcharts>
   </div>
</template>
<script>
import VueApexCharts from 'vue-apexcharts'

export default {
    components: {
      apexcharts: VueApexCharts,
    },
    props: ["datasets", "labels", "title", "height"],
    data: function() {
      return {
        chartOptions: {
          title: {
            text: this.title,
            style: {
              fontSize:  '18px',
              color:  '#263238'
            },
          },
          dataLabels: {
                enabled: false
          },
          stroke: {
                curve: 'smooth'
          },
          xaxis: {
            type: 'categories',
            categories: this.labels,
            labels: {
              show: false,
            },
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
          },
          yaxis: [
            {
              seriesName: 'Ops',
              axisTicks: {
                show: false,
              },
              axisBorder: {
                  show: false,
              },
              title: {
                text: "Ops per Layer",
              },
              labels: {
                formatter: (val) => {
                  if (val > 1e9)
                    return (val/1e9)+"G"
                  else if (val > 1e6)
                    return (val/1e6)+"M"
                  else if (val > 1e3)
                    return (val/1e3)+"k"
                  else
                    return val
                }
              },
            },
            {
              opposite: true,
              seriesName: 'Params',
              axisTicks: {
                show: false,
              },
              axisBorder: {
                  show: false,
              },
              title: {
                text: "Params per Layer",
              },
              labels: {
                formatter: (val) => {
                  if (val > 1e9)
                    return (val/1e9)+"G"
                  else if (val > 1e6)
                    return (val/1e6)+"M"
                  else if (val > 1e3)
                    return (val/1e3)+"k"
                  else
                    return val
                }
              },
            }
          ],
        },
      }
    },
    computed: {
      series() {
        return this.datasets;
      },
    },
};
</script>

<!-- <template>
  <div></div>
</template>

<script>
//import Chart from 'chart.js';
import { Chart } from 'frappe-charts/dist/frappe-charts.esm.js';
export default {
  name: 'LineChart',
  props: ["datasets", "labels"],
  data() {
    return {
      data : {
        labels: ["12am-3am", "3am-6pm", "6am-9am", "9am-12am",
            "12pm-3pm", "3pm-6pm", "6pm-9pm", "9am-12am"
        ],
        datasets: [
            {
                name: "Some Data", type: "bar",
                values: [25, 40, 30, 35, 8, 52, 17, -4]
            },
            {
                name: "Another Set", type: "line",
                values: [25, 50, -10, 15, 18, 32, 27, 14]
            }
        ]
      },
      chart: null
    }
  },
  mounted() {
    console.log(Chart);
    const chart = new Chart(this.$el, {
        //title: "My Awesome Chart",
        data: {
          labels: this.labels,
          datasets: this.datasets,
        },
        type: 'line', // or 'bar', 'line', 'scatter', 'pie', 'percentage'
        height: 250,
        lineOptions: {
          areaFill: 1, // default: 0
        },
        colors: ['#7cd6fd', '#743ee2']
    })
    this.chart = chart;
  },
  watch: {
    datasets: function(newVal, oldVal) {
      console.log(newVal);
      const chart = this.chart;
      chart.update({
        labels: this.labels,
        datasets: this.datasets,
      });
    },
  },
}

</script> -->

<!--
import barChart from 'britecharts/dist/umd/bar.min';
import { select } from 'd3-selection';
import { validateConfiguration, validateContainer } from 'britecharts-react/src/charts/helpers/validation';
import optimizedResize from 'britecharts-react/src/charts/helpers/optimizedResize';

import { applyConfiguration } from 'britecharts-react/src/charts/helpers/configuration';

import { bar as barLoadingState } from 'britecharts/dist/umd/loading.min';

export default {
	name: 'LineChart',
	props: ["data", "configuration", "loading"],
	data() {
		return {
			$chart: null
		}
	},
	watch: {
		data: function(newVal, oldVal) {
      console.log(newVal);
			const container = select(this.$el);
			const chart = this.$chart;
			validateContainer(container);
			validateConfiguration(chart, this.configuration);
			container.datum(newVal).call(chart);
		},
	},
	methods: {
		resize: function() {
			if (!this.loading) {
				this.configuration.width = this.$el.clientWidth;
				const container = select(this.$el);
				container.call(applyConfiguration(this.$chart, this.configuration));
			}
		}
	},
	mounted() {
		if (this.loading) {
			select(this.$el).html(barLoadingState);
		} else {
			const container = select(this.$el);
			const chart = barChart();
			validateContainer(container);
			validateConfiguration(chart, this.configuration);
			container.datum(this.data).call(applyConfiguration(chart, this.configuration));
			this.$chart = chart;
			optimizedResize.addHorizontalMain(this.resize.bind(this));
		}

	},
	beforeDestroy() {
		optimizedResize.clearAll();
	}
}

</script>
-->

'use strict'

const {execFileSync} = require('child_process')
const validate = require('./lib/validate')

function exec(command) {
	return execFileSync('schtasks', [command], {
		shell : true
	})
}

module.exports = {

	get: function (taskname, format, verbose){

		return new Promise( function(resolve, reject){

			try {
				validate.get_params(taskname, format, verbose)
				
			} catch (err) {
				return reject(err.message)
			}

			let command = ` /Query`

			if (taskname) command = command.concat(` /TN ${taskname}`)
			if (format)   command = command.concat(` /FO ${format}`)
			if (verbose)  command = command.concat(` /V`)

			try {
				// pipe stderr to null to suppress unmanageable error message when not found
				const result = exec(command.concat(' 2> nul')) 
				resolve(result.toString())

			} catch (err) {
				reject('Failed to get task. status:'+err.status+' message:'+err.message+' stdout:'+err.stdout)
			}
		})
	},

	create: function(taskname, taskrun, schedule) {

		return new Promise( (resolve, reject) => {

			try {
				validate.create_params(taskname, taskrun, schedule)

			} catch (err) {
				return reject(err.message)
			}

			this.get(taskname)
			.then( () => {
				return reject('Task: Create error - Taskname already exists')
			})
			.catch( () => {
				let command = ` /Create /TN ${taskname}`

				if (schedule.frequency) command = command.concat(` /SC ${schedule.frequency}`)
				if (schedule.modifier)  command = command.concat(` /MO ${schedule.modifier}`)
				if (schedule.day)       command = command.concat(` /D  ${schedule.day}`)
				if (schedule.month)     command = command.concat(` /M  ${schedule.month}`)
				if (schedule.starttime) command = command.concat(` /ST ${schedule.starttime}`)
				if (schedule.endtime)   command = command.concat(` /ET ${schedule.endtime}`)
				if (schedule.every)     command = command.concat(` /RI ${schedule.every}`) 
				if (schedule.startdate) command = command.concat(` /SD ${schedule.startdate}`)
				if (schedule.enddate)   command = command.concat(` /ED ${schedule.enddate}`)

				if(taskrun.match(".xml")){
					taskrun = taskrun.replace(" ","^ ")
					command = command.concat(` /XML \"${taskrun}\"`)
				}else{
					command = command.concat(` /TR ${taskrun}`)
				}
				
				var result = "";
				try {
					result = exec(command)
					resolve(result.toString())
				} catch (err) {
					reject('Failed to create task. status:'+err.status+' message:'+err.message+' stdout:'+err.stdout)
				}
			})
		})	
	},

	update: function (taskname, taskrun, schedule, enable){

		return new Promise( (resolve, reject) => {

			try {
				validate.update_params(taskname, taskrun, schedule, enable)

			} catch (err) {
				return reject(err.message)
			}

			this.get(taskname)
			.then( () => {

				let command = ` /Change /RU SYSTEM /TN ${taskname}`

				if (taskrun) command = command.concat(` /TR ${taskrun}`)
				if (schedule) {
					if (schedule.starttime) command = command.concat(` /ST ${schedule.starttime}`)
					if (schedule.endtime)   command = command.concat(` /ET ${schedule.endtime}`)
					if (schedule.every)     command = command.concat(` /RI ${schedule.every}`)
					if (schedule.startdate) command = command.concat(` /SD ${schedule.startdate}`)
					if (schedule.enddate)   command = command.concat(` /ED ${schedule.enddate}`)
				}
				if (enable && enable==true)  command = command.concat(` /ENABLE`)
				if (enable && enable==false) command = command.concat(` /DISABLE`)

				try {
					const result = exec(command)
					return resolve(result.toString())

				} catch (err) {
					reject('Failed to update task. status:'+err.status+' message:'+err.message+' stdout:'+err.stdout)
				}
			})
			.catch( (err) => {
				return reject('Task: Update error - Taskname not found')
			})
		})
	},

	delete: function (taskname){

		return new Promise( (resolve, reject) => {
			try {
				validate.taskname(taskname)

			} catch (err) {
				return reject(err.message)
			}

			this.get(taskname)
			.then( () => {

				try {
					const result = exec(` /Delete /TN ${taskname} /F`)
					resolve(result.toString())

				} catch (err) {
					reject('Failed to delete task. status:'+err.status+' message:'+err.message+' stdout:'+err.stdout)
				}
			})
			.catch( () => {
				return reject('Task: Delete error - Taskname not found')
			})
		})
	},

	run: function (taskname){

		return new Promise( (resolve, reject) => {
			try {
				validate.taskname(taskname)

			} catch (err) {
				return reject(err.message)
			}

			this.get(taskname)
			.then( () => {

				try {
					const result = exec(` /Run /TN ${taskname}`)
					resolve(result.toString())

				} catch (err) {
					reject('Failed to run task. status:'+err.status+' message:'+err.message+' stdout:'+err.stdout)
				}
			})
			.catch( () => {
				return reject('Task: Run error - Taskname not found')
			})
		})
	},

	end: function (taskname){

		return new Promise( (resolve, reject) => {
			try {
				validate.taskname(taskname)
			} catch (err) {
				return reject(err.message)
			}

			this.get(taskname)
			.then( () => {

				try {
					const result = exec(` /End /TN ${taskname}`)
					resolve(result.toString())

				} catch (err) {
					reject('Failed to end task. status:'+err.status+' message:'+err.message+' stdout:'+err.stdout)
				}
			})
			.catch( () => {
				return reject('Task: End error - Taskname not found')
			})
		})
	},
}
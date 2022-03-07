import Report from './report.js'
import Vue from 'vue'
let vue =  (Vue.default || Vue)
import {
	set_page_residence_time
} from '../utils/pageTime.js'
import {
	get_page_types,
	get_platform_name
} from '../utils/pageInfo.js'

class Stat extends Report {
	static getInstance() {
		if (!vue.instance) {
			vue.instance = new Stat()
		}
		return vue.instance
	}
	constructor() {
		super()
		this.instance = null
	}

	/**
	 * 进入应用
	 * @param {Object} options 页面参数
	 * @param {Object} self	当前页面实例
	 */
	launch(options, self) {
		// 初始化页面停留时间  start
		let residence_time =  set_page_residence_time()
		this.__licationShow = true
		this.sendReportRequest(options, true)
	}
	load(options, self) {
		this.self = self
		this._query = options
	}

	appHide(self){
		this.applicationHide(self, true)
	}

	appShow(self){
		this.applicationShow(self)
	}

	show(self) {
		this.self = self
		if (get_page_types(self) === 'page') {
			this.pageShow(self)
		}
		if (get_page_types(self) === 'app') {
			this.appShow(self)
		}
	}

	hide(self) {
		this.self = self
		if (get_page_types(self) === 'page') {
			this.pageHide(self)
		}
		if (get_page_types(self) === 'app') {
			this.appHide(self)
		}
	}

	error(em) {
		// 开发工具内不上报错误
		if (this._platform === 'devtools') {
			if (process.env.NODE_ENV === 'development') {
				console.info('当前运行环境为开发者工具，不上报数据。')
				return;
			}
		}
		let emVal = ''
		if (!em.message) {
			emVal = JSON.stringify(em)
		} else {
			emVal = em.stack
		}
		let options = {
			ak: this.statData.ak,
			uuid: this.statData.uuid,
			lt: '31',
			ut: this.statData.ut,
			ch: this.statData.ch,
			mpsdk: this.statData.mpsdk,
			mpv: this.statData.mpv,
			v: this.statData.v,
			em: emVal,
			usv: this.statData.usv,
			t: parseInt(new Date().getTime() / 1000),
			p: this.statData.p,
		}
		this.request(options)
	}
}
export default Stat

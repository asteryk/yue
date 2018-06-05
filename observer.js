class Observer {
	constructor(data) {
		this.observer(data);
	}
	observer(data) {
		if (!data || typeof data !== 'object') return;
		// 劫持数据
		Object.keys(data).forEach(key => {
			// 劫持
			this.defineRective(data, key, data[key]);
			// 递归劫持
			this.observer(data[key]);
		});
	}
	// 定义响应式
	defineRective(obj, key, value) {
		let that = this;
		// 修改赋值过程
		let dep = new Dep;
		Object.defineProperty(obj,key,{
			enmuerable: true,
			configurable: true,
			get() {
				// 1.当watcher里取值的时候把Dep的target放入订阅队列里（此时Dep的target因为watcher的初始化已经获取了实例对象本身）
				Dep.target && dep.addSub(Dep.target);
				return value;
			},
			set(newValue) {
				if (newValue != value) {
					that.observer(newValue); //如果set 一个obj需要继续劫持
					value = newValue;
					// 3.通知所有人，发布订阅
					dep.notify();
				}
			}
		})
	}
}
class Dep{
	constructor(){
		// 订阅的队列
		this.subs = []
	}
	addSub(watcher){
		// 2.被watcher的实例加入订阅列表
		this.subs.push(watcher);
	}
	notify(){
		// 3.发布
		this.subs.forEach(watcher => watcher.update());
	}
}
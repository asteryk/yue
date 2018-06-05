class Watcher{
	constructor($instance,expr,cb){
		this.$instance = $instance;
		this.expr = expr;
		this.cb = cb;
		// old value
		this.value = this.get();
	}
	getVal($instance,expr){
		// a.b.c.d.e => [a,b,c,d,e]
		expr = expr.split('.');
		// 0:$instance.$data[a]
		// 1:$instance.$data.a[b]
		// 2:$instance.$data.a.b[c]
		// ... result $instance.$data.a.b.c.d.e
		return expr.reduce((prev,next)=>{
			console.log(prev,next);
			return prev[next];
		},$instance.$data);
	}
	get(){
		// 0.声明watcher的时候会把实例本身放入订阅对象Dep的target里(1&2步骤在observer里)
		Dep.target = this;
		let value = this.getVal(this.$instance,this.expr);
		// 4.用完之后置空target，方便其他的new Watcher对象
		Dep.target = null;
		return value;
	}
	// 对外暴露
	update(){
		let newValue = this.getVal(this.$instance,this.expr);
		let oldValue = this.value;
		if(oldValue != newValue){
			this.cb(newValue);
		}
	}
}
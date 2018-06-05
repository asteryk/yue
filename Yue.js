class Yue {
	constructor(options){
		this.$el = options.el;
		this.$data = options.data;
		if(this.$el){
			new Observer(this.$data);
			this.proxyData(this.$data);
			new Compile(this.$el,this);
		}
	}
	proxyData(data){
		// $instance.data.xxx => $instance.xxx 即可取到
		Object.keys(data).forEach(key => {
			Object.defineProperty(this,key,{
				get(){
					return data[key];
				},
				set(newValue){
					data[key] = newValue;
				}
			})
		})
	}
}
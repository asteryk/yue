class Compile{
	constructor(el,vm){
		this.$el = this.isElementNode(el)?el:document.querySelector(el);//#app || document.element
		this.$instance = vm;
		// console.log(this.$el,this.$instance)
		if(this.$el){
			// 1. real node -> fragment
			let fragment = this.node2fragment(this.$el);
			this.compile(fragment);
			this.$el.appendChild(fragment);
		}
	}
	// 复辅方法
	isElementNode(node){
		return node.nodeType === 1;
	}
	// 是不是指令
	isDirective(name){
		return name.includes('v-');
	}	
	// 核心方法
	compileElement(node){
		//带v-model
		let attrs = node.attributes;
		// console.log(attrs);
		Array.from(attrs).forEach(attr => {
			if(this.isDirective(attr.name)){
				// 对应的值放入节点
				let [,type] = attr.name.split('-');//v-xxx
				return compileUtil[type](node,this.$instance,attr.value);
			}
		})
	}
	compileText(node){
		let text = node.textContent;
		let reg = /\{\{([^}]+)\}\}/g;
		if(reg.test(text)){
			return compileUtil['text'](node,this.$instance,text);
		}
	}
	compile(fragment){
		let childNodes = fragment.childNodes;//children
		Array.from(childNodes).forEach(node => {
			if(this.isElementNode(node)){
				//child -> children
				// 这里编译元素
				this.compileElement(node);
				this.compile(node);
			}else{
				// 这里编译文本
				this.compileText(node);
			}
			// console.log(node,this.isElementNode(node))
		});
	}
	node2fragment(el){
		// el -> 内存
		let fragment = document.createDocumentFragment();
		let firstChild;
		while(firstChild = el.firstChild){
			fragment.appendChild(firstChild);
		}
		return fragment;
	}

}
compileUtil = {
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
	},
	setVal($instance,expr,value){
		// a.b.c.d.e => [a,b,c,d,e]
		expr = expr.split('.');
		// 0:$instance.$data[a]
		// 1:$instance.$data.a[b]
		// 2:$instance.$data.a.b[c]
		// ... result $instance.$data.a.b.c.d.e
		return expr.reduce((prev,next,currentIndex)=>{
			// 当找到最里面的那个对象不能再循环的时候赋值 [a,b,c] => $instance.a.b.c(currentIndex:2;expr.length:3) = newValue
			if(currentIndex == (expr.length - 1)){
				prev[next] = value;
			}
			return prev[next];
		},$instance.$data);
	},
	getTextVal($instance,expr){
		// {{xxxx}}{{yyyy}} => $instance.data.xxxx | $instance.data.yyyy
		return expr.replace(/\{\{([^}]+)\}\}/g,(...args)=>{
			// args:['{{xxxx}}','xxxx',length,完整字符串]
			console.log(args[1], typeof args[1]);
			return this.getVal($instance,args[1]);
		});
	},
	text(node,$instance,text){
		let updaterFn = this.updater['textUpdater'];
		let afterText = this.getTextVal($instance,text);
		// 给每一处文本注册watcher
		text.replace(/\{\{([^}]+)\}\}/g,(...args)=>{
			new Watcher($instance,args[1],(newValue)=>{
				// 数据变化的时候，文本还需要重新获取依赖的属性更新文本,即新的afterText
				let newAfterText = this.getTextVal($instance,text);
				updaterFn && updaterFn(node,newAfterText);
			})
		});
		console.log('after:'+afterText);
		updaterFn && updaterFn(node,afterText);
	},
	model(node,$instance,expr){
		let updaterFn = this.updater['modelUpdater'];
		// 在这里监控数据变化
		new Watcher($instance,expr,(newValue)=>{
			// on update => cb(newValue)
			updaterFn && updaterFn(node,this.getVal($instance,expr));
		});
		node.addEventListener('input',(e)=>{
			let newValue = e.target.value;
			this.setVal($instance,expr,newValue);
		})
		updaterFn && updaterFn(node,this.getVal($instance,expr));
	},
	updater:{
		// 文本更新
		// {{xxx}} => 实际value
		textUpdater(node,value){
			node.textContent = value;
		},
		// 元素更新
		modelUpdater(node,value){
			node.value = value;
		}
	}
}
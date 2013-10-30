
/**
 *	Ядро DeeX
 *
 *	21.02.2013
 *	@version 2.2
 *	@copyright BRANDER
 *	@author Deemon<a@dee13.ru>
 */
/////////////////////////////////
// todo Внедрить биндер клавиш //
/////////////////////////////////

/*Добавление записей в лог или консоль*/
function elog(mess, desc, type)
{
	if (typeof console != 'undefined' && typeof console.log == 'function')
	{
		if (typeof desc != 'undefined')
		{
			if (typeof type != 'undefined')
			{
				$('._elog').append('<li class="' + type + ' _js">' + (desc == '_null' ? '- ' : desc + ' :: ') + mess + '</li>');
				return;
			}
			if (['string', 'number'].indexOf(typeof mess) != -1) mess = desc + ' : ' + mess;
			else console.log(desc + ' : ');
		}
		console.log(mess);
	}
	return mess;
}
/*модернизация для того чтобы при установки данных связанных с объектом добавлялся DOM атрибут*/
$.fn.deex_data=$.fn.data;
$.fn.data=function(name,value)
{
	if(arguments.length>1)
	{
		this.deex_data(name,value);
		if(value===false)
			this.removeAttr('data-'+name);
		 else
		 	this.attr('data-'+name,value);
		return this;
	}
	else if(arguments.length==1)
	{
		if(typeof name =='object')
		{
			var obj={};
			for(var key in name)
				obj['data-'+key]=name[key];
			this.attr(obj);
		}
		var data=this.deex_data(name);
		return typeof data =='undefined'?null:data;
	}
	else
		return this.deex_data();
};
/*Главная точка наследования */
var _ =
{
	'window':false,
	'is_sys':false,
	'init_order':false,
	/*Инициализация всех модулей*/
	'initAll':function(first)
	{

		if(arguments.length==0 || first==true)
		{
			first=true;
			$(document).click(this._clickOutside);
			this.window =$(window);
			this.init_order=[];
			var relations={};
			var modules_count=0;
			/*Составляю список модулей и добавляю системные переменные*/
			for(var module_name in this)
			{
				var val=this[module_name];
				if(typeof val._init == 'function')
				{
					val._name=module_name;
					var a='';
					if(first && typeof val._response == 'function')
					{
						a=' with ajax';
						val._ajax=function (data,params){
							return _.ajax(
								('f_name' in params
									?params.f_name
									:(this['_ajax_f_name' in this?['_ajax_f_name']:'_name'])),
								data,
								'_.'+this._name+'._response',params
							);
						};
					}
					if(first)
					{
						if('_init_after' in val)
						{
							relations[module_name]=val._init_after;
							modules_count++;
						}
						else
							this.init_order.push(module_name);
					}
				}
			}
			/*Составляю порядок инициализации модулей*/
			for(var i=0;i<modules_count;i++)
			{
				for(var name in relations)
				{
					var good=true;
					for(var key in relations[name])
					{
						var mod_name=relations[name][key];
						if(mod_name in relations)
						{
							good=false;
							break;
						}
					}
					if(good)
					{
						this.init_order.push(name);
						delete relations[name];
						break;
					}
				}
			}
			/*На случай если есть модули зависимые от тех что не подключены*/
			for(var name in relations)
				_.message.show('Минимум один из необходимых для '+name+' модулей '+relations[name].join(', ')+' не найден',error);
				//this.init_order.push(name);
		}
		for(var key in this.init_order)
		{
			var module_name=this.init_order[key];
			this[module_name]._init(first);
			elog(module_name,'inited');
		}
	},
	'a_boom':function()
	{
		elog('boom','');
		if(this._ajax_boom.length)
		{
			$.post('/ajax?_a_boom=1', {'_d':this._ajax_boom,'_s':this.page.getState()}, this._ajaxResponse);
			this.loading.start('_boom','Идет загрузка страницы');
		}
		else
			this._ajax_boom=true;
	},
	'_ajax_boom':[],
	'_requests': [],
	/*Аякс запрос*/
	'ajax': function(f_name, data, func_name,params)
	{
		elog('REQUEST','');
		params=$.extend({'action':false,'sys':this.is_sys,'params':false,'desc':false},params);
		var n=params.sys+func_name+params.action;

		var ind = this._requests.push({'f':func_name,'p':params.params,'n':n})-1;
		if(this._ajax_boom===true)
		{
			if(params.desc)
				this.loading.start(n,params.desc);
			$.post('/ajax?_f='+f_name+(params.sys?'&_s=1':'')+(params.action?'&_a='+params.action:'')+'&_i='+ind, {'_d':data,'_s':_.page.getState()}, this._ajaxResponse);
		}
		else
			this._ajax_boom.push({'f':f_name,'s':(params.sys?1:0),'a':params.action,'i':ind,'d':data});
		return ind;
	},
	 /*Преобразование данных и запуск обработчика*/
	'_ajaxResponse': function(data)
	{
		/*Проверка на правильность ответа*/
		if (data[0] == '{')
		{
			eval('data=' + data + ';');
			if('_a_boom' in data)
			{
				delete data['_a_boom'];
				delete data['speed'];
				_._ajax_boom=true;
				for(var key in data)
					_._ajaxResponse_(data[key]);
				_.loading.stop('_boom');
			}
			else
				_._ajaxResponse_(data);

		}
		else
		{
			data='полученные данные "' + data + '"', 'непредвиденная ошибка для обработчика ';
			elog(data, ' error');
			_.mess.show(data,'error');
		}

	},
	'_ajaxResponse_':function(data)
	{
		// elog(data,'AJAX RESPONSE');
			if(!('i' in data) ||!('a' in data) || data.i==-1)
			{
				elog('Не возвращен индекс запроса','Ошибка Ajax',' error ');
				return false;
			}
			else if (!(data.i in _._requests))
			{
				elog('Индекс возвращенный запросом не действителен','Ошибка Ajax','error');
				return false;
			}
			this.loading.stop(_._requests[data.i].n);
			/*Вывод лога*/
			if ('elog' in data) for (var key in data.elog)
			{
				var val = data.elog[key];
				elog(val[0], val[2], val[1]);
			}
			/*Не правильно выведенный контент*/
			if ('echo' in data)
				elog(data.echo,'Не верный вывод в ajax','error');
			/*Сообщение*/
			if ('mess' in data)
			 	_.mess.show(data.mess);
			// Запуск исполняемого кода и вызов функции отклика
			eval(('eval' in data? data.eval+';':'')+ _._requests[data.i].f + '(data.data,{"index":'+data.i+',"action":data.a,"params":_._requests[data.i].p});');
			delete _._requests[data.i];
	},
	/*Обработка клика вне объекта*/
	'outsideClick':{},
	'_clickOutside':function(e)
	{
		var target=false;
		for(var key in _.outsideClick)
		{
			var val=_.outsideClick[key];
			if(val.active)
			{
				if(target==false)
					target=$(e.target);
				if(!target.closest(val.selector).length)
				{
					val.func(val.params);
					val.active=false;
				}
			}
		}
		// elog(e,'clickOutside');
	},
	/*Фильтрует список по тексту*/
	'filter':function(obj_list,text)
	{
		var text = new RegExp(text.replace(new RegExp('\\s+','g'),'.*'), 'i');
		var found=0;
		obj_list.each(function() {
			var o = $(this);
			if(text.test(o.text()))
			{
				o.removeClass('_filtred');
				found++;
			}
			else
				o.addClass('_filtred');
		});
		return found;
	},
	/*Позиционировать один объект относительно другого*/
	'reposition':function(pos_obj,moving_obj)
	{
		moving_obj.css('position','absolute').appendTo('body');
		var cl=['left','bottom'];
		var p_size=pos_obj.offset();
		p_size={'top':p_size.top,'left':p_size.left,'h':pos_obj.outerHeight(),'w':pos_obj.outerWidth()};
		var css={'top':p_size.top,'left':p_size.left};
		var m_size={'h':moving_obj.outerHeight(true),'w':moving_obj.outerWidth(true)};
		var win= this.window;
		win={'h':win.height(),'w':win.outerWidth(),'top':win.scrollTop()};
		if(pos_obj.offset().top>(win.h/2))
		{
			css.top-=m_size.h;
			cl[1]='top';
		}
		else
			css.top+=p_size.h;
		if(pos_obj.offset().left+m_size.w>win.w)
		{
			elog('','true');
			css.left=win.w-m_size.w;
			cl[0]='right';
		}
		moving_obj.css(css);
		return cl;
	},
	/*Работа с прототипами*/
	'prot':
	{
		'def_prots':{},
		'prepared':{},
		'_init':function()
		{
		},
		'check':function(prot_name,names)
		{
			if(prot_name in this.prepared)
				return true;
			var names=prot_name.split('.');
			var new_name='';
			for(var key in names)
			{
				var name=names[key];
				var prot;
				var main=false;
				if(new_name=='')
				{
					if(!(name in this.def_prots))
						return false;
					prot=$(this.def_prots[name]).wrapAll('<div>').parent();
					new_name=name;
					main=true;
				}
				else
				{
					prot=this.prepared[new_name]['sub_prots'].find('[data-prot='+name+']');
					if(prot.length==0)
						return false;
					new_name+='.'+name;
					if(new_name in this.prepared)
						continue;
				}
				var prots='<div>';
				prot.find('[data-prot]').each(function(){
					var ob=$(this).wrap('<div>').parent();
					prots+=ob.html();
					ob.remove();
				});
				var o=prot;
				if(!main)
					o=o.wrapAll('<div>').parent();
				this.prepared[new_name]=
				{
					'sub_prots':$(prots+'</div>'),
					'main':o.find('[data-item]').each(function(){
						var o=$(this);
						o.parent().data({'prot_n':new_name,'item_list':o.data('item')});
					}).end()
				};
				// elog(o.html(),'o');
			}
			return true;


		},
		'setData':function(text,data)
		{
			for(var key in data)
			{
				var val=data[key];
				if(!$.isArray(val))
				{
					if(typeof val=='object' && val.constructor === jQuery )
						val=val.wrapAll('<div>').parent().html();
					text=text.replace(new RegExp('#'+key+'#','g'),val);
				}
			}
			return text;
		},
		/*Получить клон загруженного прототипа или false с возможностью загрузки*/
		'get':function(prot_name,data,modifer)
		{
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			//todo Сделать проверку по типу данных если объект то вставить блок с кодовым классом и заменить на объект в постобработке //
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            var jq_objects = {};
			if(this.check(prot_name))
			{
				var finded=this.prepared[prot_name];
				var clone_obj=finded.main.clone();
				var i_obj=clone_obj.find('[data-item]');
				/*Если переданы данные заполнить прототип*/
				if(typeof data!=='undefined')
				{
					for(var val_name in data)
					{
						var i_name=(val_name+'').replace(/^item_/,'');
                        if (typeof data[val_name] == 'object' && data[val_name] instanceof $)
                        {
                            jq_objects[val_name] = data[val_name];
                            data[val_name] = '<div class="_class__'+val_name+'"></div>';
                        }

                        /*Если массив то переданы элементы списка*/
                        if(val_name!=i_name)
                        {
                            var i=i_obj.filter('[data-item='+i_name+']');
                            var items='';
                            if(i.length)
                            {
                                var html=i.wrap('<div>').parent().html();
                                i.unwrap();
                                for(var key in data[val_name])
                                {
                                    var val=data[val_name][key];
                                    items+=this.setData(html,val);
                                }
                                i.replaceWith(items);
                            }
                            else
                                i.remove();
                        }

					}
					i_obj.remove();

					clone_obj= this.setData($(clone_obj).html(),data) ;
				}
				else
				{
					i_obj.remove();
					clone_obj=clone_obj.find('[data-item]').remove().end().html();
				}

				if(arguments.length==2)
					modifer='';
                clone_obj = $(clone_obj.replace(/#[\w_\d]+#/g,'')).addClass(modifer);
                for(var val_name in jq_objects)
                    clone_obj.find('div._class__'+val_name).after(jq_objects[val_name]).remove();
                return clone_obj;
			}
			return $();
		},
		'update_items':function(obj,item_name,values,append)
		{

			var place=obj.wrapAll('<div>').parent().find('[data-item_list='+item_name+']:first');
			var item=this.prepared[place.data('prot_n')].main.find('[data-item='+item_name+']').clone().wrap('<div>').parent().html();
			var items='';
			for(var key in values)
				items+=this.setData(item,values[key]);
			if(arguments.length<3 || !append)
				place.find('[data-item='+item_name+']').remove().end();
			place.append(items.replace(/#[\w_\d]+#/g,''));
			obj.unwrap();
		},
	},
	'loading':
	{
		'obj':false,
		'text_obj':false,
		'arr':{},
		'length':0,
		'curr_name':false,
		'_init':function(first)
		{
			if(!first)
				return;
			this.obj=$('._loading');
			this.text_obj=this.obj.find('._text')
		},
		'start':function (name,desc)
		{
			if(!(name in this.arr))
			{
				this.arr[name]=desc;
				this.curr_name=name;
				if(++this.length==1)
					this.obj.delay(1000).fadeIn();
				this.text_obj.html(desc);
			}
		},
		'stop':function(name)
		{
			if(name in this.arr)
			{
				delete(this.arr[name]);
				if(--this.length==0)
					this.obj.clearQueue().fadeOut();
				else if(this.curr_name==name)
				{
					this.curr_name=Object.keys(this.arr)[0];
					this.text_obj.html(this.arr[this.curr_name]);
				}
			}
		}
	},
};

/*
	модули
		модулем считается объект сохраненный как свойство объекта _ и имеющий метод _init()
		к модулям автоматически добавляются
			свойство _name хранящее имя модуля
			при наличии метода _response(response_data,index) добавляется метод (index) _ajax(request_data,is_sys|{'sys':is_sys,'action':'my_action'}) отправляющий запросы на файл по имени модуля
			-deep this._ajax({})|this._ajax() загрузит только необходимые протатипы

	Для прототипов. Для заполнения данными использовать класс ._d._my_var_name
	обработка клика вне {active:bool,func:handle,params:mixed,selector:string}
*/
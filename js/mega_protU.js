/**
 *    Мего прототип DEEX CMF
 *
 *    30.08.2013
 *    @version 1
 *    @copyright BRANDER
 *    @author Deemon<a@dee13.ru>
 */
var DeeXProt=function(name, data, parent, index)
{
	var self=this;
	if(!(name in _.mega_prot.rules))
	{
		_.mess.show('Нет правил для прототипа '+name, 'warning');
		return false;
	}
	this.name=name; // prot name
	if(arguments.length<4) this.index=Object.keys(_.mega_prot.deex_prots).length+1;
	else this.index=index;
	if(arguments.length<3) this.parent=false;
	else this.parent=parent;
	if(arguments.length<2) this.data={};
	else this.data=data;
	var rules=_.mega_prot.rules[name];
	var dom_obj=$(_.mega_prot.prots[name]);
	var dict_dom={}; // dom -> obj  {e:element, p:property, o:original}

	this._genObj=function(rule, obj)
	{
		var item;
		if($.inArray(rule[0], ['obj', 'arr'])> -1 && 'data' in rule)
			for(var key in rule['data'])
			{
				item=rule['data'][key];
				if(item[0]=='prot' && 'prot_name' in item)
					obj[key]=_.mega_prot.get(item.prot_name, this.data[key], undefined, this);
				else if(item[0]=='arr' && 'data' in item)
				{
					obj[key]=[];
				}
				else
					obj[key]=('def' in item ? item['def'] : '');
				this._prepareProperty(key);
			}
		else
			for(var key in rule)
			{
				obj[key]=('def' in rule[key] ? rule[key]['def'] : '');
				this._prepareProperty(key);
			}
	}
	this._prepareProperty=function(prop_name)
	{
		var v=this[prop_name];
		_.mega_prot._defGetSet(this, prop_name,
			function()
			{
				//console.log('getter()', prop_name);
				return v;
			},
			function(val)
			{
				// TODO: validation by rule?
				//console.log('setter()', prop_name, val);
				v=val;
				this._update(prop_name, val);
			}
		);
	}
	this._getRule=function(_name, _rules)
	{
		_rules=typeof _rules=='undefined' ? rules : _rules;
		if(_name in _rules)
			return _rules[_name];
		if(_rules[0]=='obj')
			if(_name in _rules['data'])
				return _rules['data'][_name];
		return false;
	}
	this._prepVars=function(html_elem)
	{
		var re=/#([^#]+)#/g;
		do
		{
			html_elem.dx_prot=self; // keep reference to this instance
			if(html_elem.nodeType===3)
			{
				var text_vars=html_elem.nodeValue.match(re);
				if(text_vars!=null)
					$.each(text_vars, function(i, v)
					{
						v=v.replace(/#/g, '');
						if(!(v in dict_dom)) dict_dom[v]=[];
						// demo_int: [{e: html_elem, p:text, o:'static text #dyn_text# other static part'}, ...]
						var prop_type=html_elem.parentNode.type=='textarea' ? 'value' : 'text';
						dict_dom[v].push({elem: html_elem.parentNode, prop: prop_type, orig: html_elem.nodeValue, deps: []});
					});
			}
			else if(html_elem.nodeType===1)
				$.each(html_elem.attributes, function(attr_idx, attr)
				{
					var att_vars=attr.value.match(re); // get all #var# variables
					if(att_vars!=null)
						$.each(att_vars, function(var_idx, var_elem)
						{
							var_elem=var_elem.replace(/#/g, '');
							if(!(var_elem in dict_dom)) dict_dom[var_elem]=[];
							dict_dom[var_elem].push({elem: html_elem, prop: attr.name, orig: attr.value, deps: []});
						});
				});
			if(html_elem.hasChildNodes())
				this._prepVars(html_elem.firstChild);
		}while(html_elem=html_elem.nextSibling);
	}
	this._detectDeps=function()
	{
		var re=/#([^#]+)#/g;
		$.each(dict_dom, function(prop_name, prop_list)
		{
			$.each(prop_list, function(prop_idx, prop_obj)
			{
				var vars=prop_obj.orig.match(re);
				if(vars!=null && vars.length>1)
					$.each(vars, function(vidx, vname)
					{
						vname=vname.replace(/#/g, '');
						if(vname==prop_name) return true;
						$.each(dict_dom[vname], function(_ip, _pr)
						{
							if(_pr.prop==prop_obj.prop && vname in self)
								prop_obj['deps'].push(vname);
						});
					});
			});
		});
	}
	this._update=function(var_name, val)
	{
		var prop_list=dict_dom[var_name];
		var rule=self._getRule(var_name);
		var is_sub_prot=(rule && 0 in rule && rule[0]=='prot');
		var prot=is_sub_prot ? _.mega_prot.deex_prots[rule.prot_name] : undefined;
		$.each(prop_list, function(prop_idx, prop_obj)
		{
			//console.log('prop_obj for update:', prop_obj);
			var html_elem=prop_obj['elem'],
				jq_elem=$(html_elem),
				prop_type=prop_obj['prop'],
				new_val=prop_obj['orig'];
			if(is_sub_prot)
				jq_elem.empty().append(prot);
			else
			{
				var vars=[var_name];
				vars.push.apply(vars, prop_obj.deps); // extend array
				$.each(vars, function(vidx, vname)
				{
					new_val=new_val.replace(new RegExp('#'+vname+'#', 'g'), var_name==vname ? val : self[vname]);
				});
				console.log('new_val=', new_val);
				if($.inArray(prop_type, ['checked', 'readonly', 'disabled'])> -1)
				{
					if($.inArray(new_val+'', ['0', 'off', 'no', 'false', '', 'null', 'undefined'])> -1) new_val=false;
					jq_elem.removeAttr(prop_type).prop(prop_type, !!new_val);
				}
				else
				{
					if($.inArray(new_val+'', ['false', 'null', 'undefined'])> -1) new_val='';
					if(prop_type=='value') jq_elem.val(new_val); // value
					else if(prop_type=='text') jq_elem.text(new_val); // text/html
					else jq_elem.attr(prop_type, new_val); // other attributes
				}
				//console.log('new_val_2=', new_val);
			}
		});
	}
	this.append=function(var_name, val)
	{
		var rule=this._getRule(var_name);
		var new_idx=false;
		console.log('rule:', rule);
		if(rule[0]=='arr')
			new_idx=self[var_name].push(val);
		console.log('self[var_name]:', self[var_name]);
		return new_idx;
	}
	this.remove=function(var_name, index)
	{
		var rule=this._getRule(var_name);
		if(rule[0]=='arr' && index in self[var_name])
			self[var_name].splice(index, 1);
	}
	this._initVals=function()
	{
		$.each(dict_dom, function(prop_name, prop_list)
		{
			self._update(prop_name, self[prop_name]);
		});
	}
	this.getJqObj=function()
	{
		return dom_obj;
	}
	this.getDict=function()
	{
		return dict_dom;
	}
	this.setProtVal=function(dx_prot, target)
	{
		var dict=dx_prot.getDict();
		$.each(dict, function(prop_name, prop_list)
		{
			$.each(prop_list, function(prop_idx, prop_obj)
			{
				if(prop_obj.elem.type==target.type)
					if(prop_obj.prop=='value' && $.inArray(target.type, ['textarea', 'select', 'text', 'number', 'password', 'email', 'range', 'search', 'tel', 'url', 'date', 'datetime', 'datetime-local', 'month', 'week', 'color'])> -1)
						dx_prot[prop_name]=$(target).val();
					else if(prop_obj.prop=='checked' && target.type=='checkbox')
						dx_prot[prop_name]=$(target).prop('checked');
			});
		});
	}
	_.mega_prot.deex_prots[name]=dom_obj;
	this._genObj(rules, this);
	this._prepVars(dom_obj[0].firstChild);
	this._detectDeps();
	this._initVals();
	return this;
}

_.mega_prot=
{
	'_init_after': ['mess'],
	'rules'      : {},
	'prots'      : {},
	'deex_prots' : {},
	'main'       : false,
	'_init'      : function(first)
	{
		if('defineProperty' in Object)
			this._defGetSet=function(obj, prop_name, getter, setter)
			{
				Object.defineProperty(obj, prop_name, {get: getter, set: setter, enumerable: true, configurable: true});
			};
		else if('__defineGetter__' in Object.prototype)
			this._defGetSet=function(obj, prop_name, getter, setter)
			{
				Object.prototype.__defineGetter__.call(obj, prop_name, getter);
				Object.prototype.__defineSetter__.call(obj, prop_name, setter);
			};
		_.mega_prot.prots=_.prot.prot_list;
		$(document.body).on('change', function(__event)
		{ // body onChange handler
			console.log('onChange fired!');
			__event.target.dx_prot.setProtVal(__event.target.dx_prot, __event.target);
		});

		p2=_.mega_prot.get('demo2');
		p3=_.mega_prot.get('demo2');
		p2.getJqObj().appendTo('._ac');
		p3.getJqObj().appendTo('._ac');
		//_.mega_prot.prots.demo1.appendTo('._ac');
		//console.log('p2=', p2.getJqObj(), 'p3=', p3.getJqObj());

	},
	'_defGetSet' : function()
	{
		throw "error: browser is not support getter/setter";
	},
	'prepare'    : function(name, rules)
	{
		// подготовка к связке
	},
	'addRules'   : function(rules, name)
	{
		this.rules[name]=rules;
	},
	'getRule'    : function(name, rules)
	{
		rules=typeof rules=='undefined' ? this.rules : rules;
		if(name in rules) return rules[name];
		var ns=name.split('.'), n=ns.shift();
		if(rules[n][0]=='obj') return _.mega_prot.getRule(ns.join('.'), rules[n]['data']);
	},
	'get'        : function(name, data, rules, parent) // name - prot name, key in rules; data
	{
		if('undefined'!= typeof rules) this.addRules(rules, name);
		if(arguments.length==1) data={};
		return new DeeXProt(name, data, parent);
		// return JavaScript Object (e.g. DeeXProt)
	}
}

//var p=_.mega_prot.get('login', false, {'demo_text': {0: 'text', def: 'test string'}});
//console.log('prot=', p);

_.prot.add({
	'demo1': '<div>\n\t<span>#demo_text2#</span>\n\t<input type="number" value="#demo_int2#"/>\n</div>\n',
	'demo2': '<div>\n\t<p>#demo_text#</p>\n\t<select name="sel" id="sel" value="#demo_select#">\n\t\t<option value="1">One</option>\n\t\t<option value="2">Two</option>\n\t\t<option value="3">Three</option>\n\t</select>\n\t<input type="date" name="date" id="date" value="#demo_date#"/>\n\t<label><input id="bool" type="checkbox" checked="#demo_bool#"/>#demo_text#</label>\n\t<input type="number" value="#demo_int#" class="#class1# #class2#" style="width: 50px;"/>\n\t<textarea id="ta" cols="10" rows="3">#demo_area#</textarea>\n\t<div id="demo_prot_container">#demo_prot#</div>\n\t<p>#demo_area#</p>\n</div>\n',
	'demo3': '<li>#item#</li>'
});
_.mega_prot.addRules({
	demo_text2: {0: 'text', def: 'prot demo text'},
	demo_int2 : {0: 'int', def: 123}
}, 'demo1');
// FIXME: some special inputs do not work after validation error, when value set via JS
// TODO: implement select tag with multiple attribute

_.mega_prot.addRules({0: 'text'}, 'demo3');

_.mega_prot.addRules({
	0     : 'obj',
	'data': {
		'demo_prot'  : {0: 'prot', prot_name: 'demo1'},//,//Дополняется прототипом any_prot
		'demo_select': {0: 'values', 1: 'min val', 2: 'max val', def: '3', data: {'key': 'val'}, multi: false}, // type=select OK!
		'demo_date'  : {0: 'date', def: '2016-11-24'}, // type=date OK!
		'class1'     : {0: 'text', def: 'cls1'},
		'class2'     : {0: 'text', def: 'cls2'},
		'demo_int'   : {0: 'int', def: 123}, // type=number OK!
		'demo_bool'  : {0: 'bool', def: true}, // type=checkbox OK!
		'demo_text'  : {0: 'html', def: 'demo text content'},
		'demo_area'  : {0: 'html', def: 'text area content'},
		'demo_arr'   : {0: 'arr', data: {0: 'prot', prot_name: 'demo3'}}
	}
}, 'demo2');

var p2, p3;

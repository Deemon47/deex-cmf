/**
 *	Реализация прототипов  DEEX CMF
 *
 *	30.10.2013
 *	@version 1
 *	@author Deemon<a@dee13.ru>
 */
var DeeXProt=function(prot_name,data)
{
	if(!(prot_name in _.prot.prots_list))
		/*There is no prot*/
		return false;
	var jq_obj=false,
		jq_links={},
		private_obj={},
		dict={},
		is_single_val=false
		;
	/*{
		'option_name':
		[
			['attr',jq_obj,'href','#parent_url#/#url#'],
			['text',jq_obj,'Общее количество #count#'],
		],
		'content':
		[
			['text',jq_obj],
		],
		'list':
		[
			['arr',jq_obj,'fieldset.list-elem']
		]
	}*/

	_.prot.tmp_container.empty();
	var prot=_.prot.prots_list[prot_name],
		hash_reg=/^#[^#]+#$/,
		quot_reg=/^".*"$/,
		tag_name,
		attr_dict,
		tag_attr,
		attr_length,
		i=-1;
	var THIS=this;
	/*Parsing prototype*/
	var loop=function(container,lvl)
	{
		i++;
		var data='';
		tag_name='';
		tag_attr={};
		attr_dict=[];
		attr_length=0;
		var keys=[];
		var props=[];
		var new_obj=false;
		var ignore_spec=false;
		var addTag=function()
		{
			if(attr_length!=0||tag_name!='')
			{
				if(tag_name=='')
					tag_name='div';
				new_obj=$('<'+tag_name+'>',tag_attr);
				var input_val=false;
				for(var key in attr_dict)
				{
					var val=attr_dict[key];
					val[1][1]=new_obj;
					if(val[1][2]=='value' && val[1].length==3)
						input_val=val[0];
					if(!(val[0] in dict))
						dict[val[0]]=[];
					dict[val[0]].push(val[1]);
				}
				if(input_val!==false && tag_name=='input')
					new_obj.data('prop',input_val).keyup(function(){
						var o=$(this);
						THIS[o.data('prop')]=o.val();
					});
				container.append(new_obj);
				attr_length=0;
				attr_dict=[];
				tag_name='';
				tag_attr={};
			}
		};
		for(i;i<prot.length;i++)
		{
			var c=prot[i];
			if(c=='"')
				ignore_spec=!ignore_spec;
			else if((!ignore_spec && $.inArray(c,['>', '(', ')', '{', '}', '[', ']', '=', '~', '.', '+'])!=-1)|| c=='#')
			{
				var clear=true;
				var push=false;
				var last_key=false;
				if(keys.length==0 &&tag_name=='')
					tag_name=data;
				if(keys.length>0)
				{
					last_key=keys[keys.length-1];
					if(last_key[0]=='id'||last_key[0]=='class')
					{
						keys.pop();
						if(last_key[0]=='id')
							tag_attr['id']=data;
						else if(!('class' in tag_attr))
							tag_attr['class']=data;
						else
							tag_attr['class']+=' '+data;
						attr_length++;
						data='';
					}
				}
				switch(c)
				{
					/*Sub data*/
					case '>':
						addTag();
						if(!loop(new_obj,lvl+1))
							return false;

						break;
					/*Group start*/
					case '(':
						if(!loop((new_obj==false?container:new_obj),lvl+1))
							return false;
						addTag();

						break;
					/*Group end*/
					case ')':
						addTag();
						return true;
					case '.':/*Attribute class name*/
						c='class';
					case '[':/*Attribute start*/
					case '{':/*Text start*/
					case '=':/*Attribute name end; value start*/
					case '~':/*Default value start*/
						push=true;
						break;
					/*Text end*/
					case '}':
						if(!last_key|| last_key[0]!='{')
							return false;
						if(props.length>0)/*Masked string*/
						{

							var mask=data.split('#');
							var is_prot=true;
							for(var key in mask)
							{
								var val=mask[key];
								is_prot=!is_prot;
								if(val=='')
									continue;
								if(!is_prot)
									container.append(val);
								else
								{
									var t=document.createTextNode('');
									container.append(t);
									var prot_name=val.split('~')[0];
									if(!(prot_name in dict))
										dict[prot_name]=[];
									dict[prot_name].push(['text',t,false,$(t)]);
								}
							}
						}
						else /*Static text*/
							container.append(data);
						props=[];
						keys.pop();
						break;
					/*Attribute end*/
					case ']':
						if(!last_key)
							return false;
						if(last_key[0]=='[')/*attribute without value*/
						{
							keys.pop();
							break;
						}
						if(last_key[0]=='=' && (d=keys[keys.length-2])[0]=='[')
						{
							var mask=prot.substr(last_key[1],i-last_key[1]).replace(quot_reg,'$1');
							var attr_name=prot.substr(d[1],last_key[1]-d[1]-1);
							if(props.length>0)
							{
								if(props.length==1 && hash_reg.test(mask))/*without mask*/
									attr_dict.push([props[0],['attr',false,attr_name]]);
								else/*masked*/
								{
									d=['attr',false,attr_name,mask,props];
									for(var key in props)
										attr_dict.push([props[key],d]);
								}
								props=[];
							}
							else
							{
								tag_attr[prot.substr(d[1],last_key[1]-d[1]-1)]=mask;
								attr_length++;
							}
							keys.pop();
							keys.pop();
						}
						else
							return false;
						break;
					/*Mask end or attribute ID value*/
					case '#':
						if(!last_key)
						{
							c='id';
							push=true;
							break;
						}
						if(last_key[0]=='#'||last_key[0]=='~')
						{
							var d=prot.substr(last_key[1],i-last_key[1]);
							if(last_key[0]=='~')
							{
								var val=d;
								if(keys.length==0 || (d=keys[keys.length-2])[0]!='#')
									return false;
								d=prot.substr(d[1],last_key[1]-d[1]-1);
								private_obj[d]=val;
								keys.pop();
							}
							props.push(d);
							keys.pop();
						}
						/*prot name*/
						else if(keys.length>2 && last_key[0]=='=' && keys[keys.length-3][0]=='{')
						{
							//todo add subprot
							keys.pop();
							keys.pop();
							break;
						}
						else
							push=true;
						data+=c;
						clear=false;
						break;
					/*Previous tag end; start next tag*/
					case '+':
						if(keys.length!=0)
							return false;
						new_obj=false;
						addTag();
						break;
				}
				if(clear)
					data='';
				if(push)
					keys.push([c,i+1]);
			}
			else
				data+=c;

		}
		if(data!='')
			tag_name=data;
		if(lvl==0)
			addTag();
		return true;
	}
	if(loop(_.prot.tmp_container,0))
	{
		jq_obj=_.prot.tmp_container.contents().appendTo(_.prot.container)
		// .appendTo('body');//tmp
		// _.s[prot_name]={'private_obj':private_obj,'dict':dict,'jq':jq_obj,'o':this};//tmp
		// $('body pre').append($('<div>').text(prot)).append('<br />').append($('<div>').text(jq_obj.outer())).append('<br /><br />');//tmp
		$.each(dict,function(prop_name){
			_.prot.defineGetSet(THIS,prop_name,function()
			/*Getter*/
			{
				return private_obj[prop_name];

			},
			/*Setter*/
			function(v)
			{
				private_obj[prop_name]=v;
				for(var key in dict[prop_name])
				{
					var dom_rule=dict[prop_name][key];
					switch(dom_rule[0])
					{
						case 'attr'://['attr',jq_obj,'href','#parent_url#/#url#',props],

							var val='';
							if(dom_rule.length==3)
								val=v;
							else
							{
								var val=dom_rule[4]
								for(var key in dom_rule[5])
								{
									var p_name=dom_rule[5][key];
									val.replace(new RegExp('#'+p_name+'(~.*|)#','g'),private_obj[p_name]);
								}
							}
							if(dom_rule[2]=='value')
								dom_rule[1].val(val)
							else
								dom_rule[1].attr(dom_rule[2],val);
							break;
						case 'text'://['text',jq_obj,after_obj,jq_for_after]
							var val=v;
							if(dom_rule[2]!==false)
							{
								dom_rule[2].remove();
								dom_rule[2]=false;
							}
							if(typeof v =='object')
							{
								val=v;
								if(v.constructor==DeeXProt)
									val=v.getJQ();
								dom_rule[2]=v;
								dom_rule[3].after(val);
								val='';
							}
							dom_rule[1].data=val;
						break;

					}
				}

			});
			if(prop_name in private_obj)
				THIS[prop_name]=private_obj[prop_name];
			else
				THIS[prop_name]='';
		});
		if(dict.length==1 && '_single_val' in dict)
			is_single_val=true;


	}
	else
		elog(false,'false')
	/*return jq_object*/
	this.getJQ=function()
	{
		return jq_obj;
	};
	/*return independent copy of private_obj*/
	this.getData=function()
	{
		if(is_single_val)
			return private_obj['_single_val'];
		var result={};
		for(var prop_name in private_obj)
		{
			var val=private_obj[prop_name];
			if(typeof val=='object' && val.constructor==DeeXProt)
				val=val.getData();
			result[prop_name]=val;
		}
		return result;
	};

}
/*Jquery outerHTML method*/
jQuery.fn.outer=function()
{
	var html='';
	this.each(function(){
		html+=this.outerHTML;
	});
	return html;
};
_.s={};
_.prot=
{
	'tmp_container':$('<div>'),
	'container':$('<div>'),
	'prots_list':
	{
		fieldset:'fieldset>((legend>{Легенда})+._any_class[attr=#value# #value2#][title=Данные]>((p>{Текст #value4#})+{#any_data#}+ol>{#prop_name=fieldset_list_elem#}))',
		fieldset_list_elem:'li>{#_single_val#}',
		button:'(.button>label>button[type=#type~button#]>{#text1#}+#trololo>p.any>({Данные #text#}+p>{#text#}))+input[type=text][value=#text#]',
		multy:'(button>(span+.icon.ope[]))+span',
		'root':'div>{#cont#}',
	},
	//Запрещается использовать одинарные кавычки для обрамления значения атрибута
	//Запрещается использование обоих методов указания класса в для одного тега .cllas1.class2[class=class3] приведет к добавлению только последнего класса допускается использование .сlass1.class2.class3 или [class=class1 class2 class3]
	'_init':function(first)
	{
		/*init getter/setter technology*/
		if('defineProperty' in Object)
			this.defineGetSet=function(obj, prop_name, getter, setter)
			{
				Object.defineProperty(obj, prop_name, {get: getter, set: setter, enumerable: true, configurable: true});
			};
		else if('__defineGetter__' in Object.prototype)
			this.defineGetSet=function(obj, prop_name, getter, setter)
			{
				Object.prototype.__defineGetter__.call(obj, prop_name, getter);
				Object.prototype.__defineSetter__.call(obj, prop_name, setter);
			};
		_.root=new DeeXProt('root');
		_.root.getJQ().appendTo(document.body);
		s=new DeeXProt('button');//tmp
		_.root.cont=s;
		// s2=new DeeXProt('fieldset')//tmp
		// s2=new DeeXProt('multy')//tmp

	},
	'defineGetSet' : function()
	{
		elog("Your browser is not support getter/setter - main engine technology",'ERROR');
	},
}
function addScript(src)
{
	var newScript = document.createElement("script");
	newScript.type = "text/javascript";
	newScript.src =  src;
	document.head.appendChild(newScript);
}
// addScript("http://code.jquery.com/jquery-2.0.3.min.js");
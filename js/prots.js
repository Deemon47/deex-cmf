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
	var jq_obj=$();//tmp
	var private_obj={};
	var dict=
	{
		'option_name':
		[
			['attr',jq_obj,'href','#parent_url#/#url#'],
			['data',jq_obj,'Общее количество #count#'],
		],
		'content':
		[
			['data',jq_obj],
		],
		'list':
		[
			['arr',jq_obj,'fieldset.list-elem']
		]
	}
	while(false)
	_.prot.defineGetSet(this,prop_name,function(){
		/*Getter*/

	},function(){
		/*Setter*/

	});
	var i=-1;
	_.prot.tmp_obj.empty();
	var prot=_.prot.prots_list[prot_name];
	var reg=/^#[^#]+#$/;
	var loop=function(conteiner)
	{
		i++;
		var tag_name='';
		var tag_attr={};
		var attr_length=0;
		var data='';
		var keys=[];
		var props=[];
		var new_obj=false;
		var ignore_spec=false;
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
						if(tag_name=='')
							tag_name='div';
						tag_attr[last_key[0]]=data;
						attr_length++;
						data='';
					}
				}
				switch(c)
				{
					case '>':
						new_obj=$('<'+tag_name+'>',tag_attr);
						tag_name='';
						tag_attr={};
						attr_length=0;
						conteiner.append(new_obj);
						if(!loop(new_obj))
							return false;
						break;
					case '(':
						if(!loop(new_obj==false?conteiner:new_obj))
							return false;
						break;
					case ')':
						if(attr_length!=0||tag_name!='')
						{
							new_obj=$('<'+(tag_name==''?'div':tag_name)+'>',tag_attr);
							conteiner.append(new_obj);
						}
						return true;
					case '[':
						if(tag_name=='')
							tag_name='div';
					case '{':
						push=true;
						break;
					case '}':
						if(!last_key|| last_key[0]!='{')
							return false;
						/*Masked string*/
						if(props.length>0)
						{
							if(props.length==1 && reg.test(data))
							{
								if(!(props[0] in dict))
									dict[props[0]]=[];
								dict[props[0]].push(['data',conteiner]);
							}
							else
								for(var key in props)
								{
									if(!(props[key] in dict))
										dict[props[key]]=[];
									dict[props[key]].push(['data',conteiner,data]);
								}
						}
						else /*Static text*/
							conteiner.append(data);
						props=[];
						keys.pop();
						break;
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
							mask=prot.substr(last_key[1],i-last_key[1]);
							if(props.length>0)
							{
								if(props.length==1 && reg.test(mask))
								{
									if(!(props[0] in dict))
										dict[props[0]]=[];
									dict[props[0]].push(['attr',conteiner]);
								}
								else
									for(var key in props)
									{

										if(!(props[key] in dict))
											dict[props[key]]=[];
										dict[props[key]].push(['attr',conteiner,mask]);
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
					case '=':
						push=true;
						break;
					case '~':
						push=true;
						break;
					case '.':
						c='class';
						push=true;
						break;
					case '#':
						if(!last_key)
							return false;
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
						else if(keys.length>0)
							push=true;
						else
						{
							c='id';
							push=true;
							break;
						}
						data+=c;
						clear=false;
						break;
					case '+':
						if(keys.length!=0)
							return false;
						new_obj=false;
						tag_name='';
						tag_attr={};
						attr_length=0;
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
		if(attr_length!=0||tag_name!='')
		{
			new_obj=$('<'+(tag_name==''?'div':tag_name)+'>',tag_attr);
			conteiner.append(new_obj);
		}
		return true;
	}
	if(loop(_.prot.tmp_obj))
	{
		elog({'private_obj':private_obj,'dict':dict},'tmp');
		elog(_.prot.tmp_obj,'tmp');
	}
	else
		elog(false,'false')

}

_.prot=
{
	'tmp_obj':$('<div>'),
	'prots_list':
	{
		fieldset:'fieldset>((legend>{Легенда})+._any_class[attr="#value# #value2#"][title=Данные]>((p>{Текст #value4#})+ol>{#prop_name=fieldset_list_elem#}))',
		fieldset_list_elem:'li>{#arr_data#}',
		button:'.button>label>button[type=#type~button#]>{#text#}',
		multy:'(button>(span+.icon))+span',
	},
	'_init':function(first)
	{
		s=new DeeXProt('button');//tmp
		// s2=new DeeXProt('fieldset')//tmp
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

		$('<input>',{'class':'text',value:'value'}).prependTo('body');
		$('body').on('keypress','.textarea.input textarea',function(e){
			if(e.charCode==13)
			{
				$(this).parents('from').submit();
				return false;
			}
		})
	},
	'defineGetSet' : function()
	{
		throw "Your browser is not support getter/setter - main engine technology";
	},
}
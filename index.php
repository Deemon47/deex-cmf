<!doctype html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>DeeX-CMF-SOLO</title>
	<script src="/js/jquery.js"></script>
	<script src="/js/jquery-ui.js"></script>
	<script src="/js/mouse-wheel.js"></script>
	<script src="/js/engine.js"></script>
	<script src="/js/prots.js"></script>
</head>
<body>

	<div class="textarea input"><textarea name="" resizeble="0" rows="1"></textarea></div>
	<input type="text" name="" id="">

	<fieldset><legend>Легенда</legend><div attr="#value# #value2#" class="_any_class" title="Данные"><p>Текст #value4#</p><ol><li></li><li></li><li></li><li></li></ol></div></fieldset>
fieldset>((legend>{Легенда})+._any_class[attr="#value# #value2#"][title=Данные]>((p>{Текст #value4#})+ol>({#prop_name=fieldset_list-elem#})))
<!-- 	fieldset>((legend>{Легенда})+._any_class[attr="#value# #value2#"][title=Данне]>((p>{Текст #value4#})+ol>(li+li+li+li+li)))
	.button>label>button[type=#type~button#]>{#text#} -->
	<script> $(function(){
		_.initAll(true);
	})</script>
</body>
</html>
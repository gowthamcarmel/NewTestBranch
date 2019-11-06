function htmlSuitelet(request, response) {

       if (request.getMethod() == "POST") {

              something = request.getParameter("something");
              nlapiLogExecution("Debug", "Input Value", something);

              response.write(html);

		} else {

			var html  = '<html>';
				html += '<head>';
				html += '<style type="text/css">';
				html += '/*custom font for text*/';
				html += '@import url(http://fonts.googleapis.com/css?family=Nunito);';
				html += '/*CSS file for fontawesome - an iconfont we will be using. This CSS file imported contains the font-face declaration. More info: http://fortawesome.github.io/Font-Awesome/ */';
				html += '@import url(http://thecodeplayer.com/uploads/fonts/fontawesome/css/font-awesome.min.css);';

				html += '/*Basic reset*/';
				html += '* {margin: 0; padding: 0; overflow: hidden;}';

				html += 'body {';
				html += '	font-family: Nunito, arial, verdana;';
				html += '}';
				html += '#accordian {';
				html += '	background: #f1f1f1;';
				html += '	width: 300px;';
				html += '	color: white;';
				html += '}';
				html += '/*heading styles*/';
				html += '#accordian h3 {';
				html += '	font-size: 0.8rem;';
				html += '	line-height: 48px;';
				html += '	padding: 0 20px;';
				html += '	cursor: pointer;';
				html += '	background: #008CBA; ';
				html += '}';
				html += '/*heading hover effect*/';
				html += '#accordian h3:hover {';
				html += '	background: #006680;';
				html += '	border-left: 5px solid #006680;';
				html += '	transition: all 0.15s;';
				html += '}';
				html += '/*list items*/';
				html += '#accordian li {';
				html += '	list-style-type: none;';
				html += '}';
				html += '/*links*/';
				html += '#accordian ul ul li a {';
				html += '	color: black;';
				html += '	text-decoration: none;';
				html += '	font-size: 0.7rem;';
				html += '	line-height: 48px;';
				html += '	display: block;';
				html += '	padding: 0 35px;';
				html += '	cursor: pointer;';
				html += '	/*transition for smooth hover animation*/';
				html += '	transition: all 0.15s;';
				html += '}';
				html += '/*hover effect on links*/';
				html += '#accordian ul ul li a:hover {';
				html += '	background: #ddd;';
				html += '	border-left: 5px solid #006680;';
				html += '}';
				html += '/*Lets hide the non active LIs by default*/';
				html += '#content2, #content3, #content4, #content5 {';
				html += '	display: none;';
				html += '}';
				html += '#accordian li.active ul {';
				html += '	display: block;';
				html += '}';
				html += '#accordian li.active h3 {';
				html += '	background: #006680;';
				html += '	border-left: 5px solid #006680;';
				html += '}';

				html += '#accordian h3.dropdown:after {';
				html += '	content: "+";';
				html += '	color: white;';
				html += '	font-weight: bold;';
				html += '	float: right;';
				html += '	margin-left: 5px;';
				html += '}';

				html += '#accordian li.active h3.dropdown:after {';
				html += '	content: "-";';
				html += '}';


				html += '#leftnav {';
				html += '	float: left;';
				html += '	width: 300px;';
				html += '	height: 1000px;';
				html += '	background: #008CBA;';
				html += '}';

				html += '#rightcontent {';
				html += '	float: left;';
				html += '	width: 350px;';
				html += '	padding: 35px 35px;';
				html += '}';

				html += '</style>';
				html += '<script src="https://system.eu1.netsuite.com/core/media/media.nl?id=4222491&c=3431250_SB99&h=15070c853a4b08b42732&_xt=.js"></script>';
				html += '<script>';
				html += '$(document).ready(function(){';
				html += '	$("#accordian h3").click(function(){';
				//html += '		//slide up all the link lists';
				html += '		$("#accordian ul ul").slideUp();';
				//html += '		//slide down the link list below the h3 clicked - only if its closed';
				html += '		if(!$(this).next().is(":visible"))';
				html += '		{';
				html += '			$(this).next().slideDown();';
				html += '		}';
				html += '	})';
					
				html += '	$("#accordian li").click(function(){';
				//html += '		//toggle active state';
				html += '		if ($(this).is("active")) {';
				html += '			$(this).removeClass("active");';
				html += '		} else {';
				html += '			$(this).addClass("active");';
				html += '		}';

				html += '		$("#accordian li").not(this).removeClass("active");';
				html += '	})';
					
					
				html += '	$(\'.menu\').click(function(){';
				html += '		  jQuery(\'.targetDiv\').hide();';
				html += '		  jQuery(\'#content\'+$(this).attr(\'target\')).show();';
				html += '	})';

				html += '})';
				html += '</script>';
				html += '</head>';
				html += '<body>';


				html += '<div id="leftnav">';
				html += '<div id="accordian">';
				html += '	<ul>';
				html += '		<li class="active">';
				html += '			<h3 class="menu" target="1">Dashboard</h3>';
				html += '		</li>';
				html += '		<!-- we will keep this LI open by default -->';
				html += '		<li>';
				html += '			<h3 class="menu dropdown" target="2">Administrator Tools</h3>';
				html += '			<ul>';
				html += '				<li><a class="menu" target="3">VAT Number Change Tool</a></li>';
				html += '				<li><a class="menu" target="4">RLF Sales Order Tester</a></li>';
				html += '				<li><a class="menu" target="5">Subscribtion Change Order Tool</a></li>';
				html += '			</ul>';
				html += '		</li>';
				html += '	</ul>';
				html += '</div>';
				html += '</div>';

				html += '<div id="rightcontent">';
				html += '<div id="content1" class="targetDiv">Lorum Ipsum1</div>';
				html += '<div id="content2" class="targetDiv">Lorum Ipsum2</div>';
				html += '<div id="content3" class="targetDiv">Lorum Ipsum3</div>';
				html += '<div id="content4" class="targetDiv">Lorum Ipsum4</div>';
				html += '<div id="content5" class="targetDiv">Lorum Ipsum5</div>';
				html += '</div>';

				html += '</body>';
				html += '</html>';

			response.write(html);
		}

}
var _ = require('underscore'),
	util = require('util'),
	EventEmitter = require('events'),
	log = require('loglevel'),
	path = require('path'),
	fs = require('fs'),
	sprintf = require("sprintf-js").sprintf;

var GET_ELEMENT_REGION = readFile(path.join(__dirname, 'js', 'get_element_region.js'));
var CALL_FUNCTION = readFile(path.join(__dirname, 'js', 'get_element_region.js'));

/*

Status WebViewImpl::CallFunction(const std::string& frame,
                                 const std::string& function,
                                 const base::ListValue& args,
                                 scoped_ptr<base::Value>* result) {
  std::string json;
  base::JSONWriter::Write(args, &json);
  // TODO(zachconrad): Second null should be array of shadow host ids.
  std::string expression = base::StringPrintf(
      "(%s).apply(null, [null, %s, %s])",
      kCallFunctionScript,
      function.c_str(),
      json.c_str());
  scoped_ptr<base::Value> temp_result;
  Status status = EvaluateScript(frame, expression, &temp_result);
  if (status.IsError())
    return status;

  return internal::ParseCallFunctionResult(*temp_result, result);
}
*/

log.setLevel('error');

function callFunction(chrome, context, func, args) {
	return CALL_FUNCTION.then(function(cfScript) {
		var expression = sprintf("(%s).apply(null, [null, %s, %s])", cfScript, func, JSON.stringify(args));
		console.log(expression);
		return evaluate(chrome, context, {
			expression: expression
		});
	});
}

function getElementValue(chrome, elementId) {
	var methodStr = "function(elem) { return elem['value'] }";
}

function getElementClickableLocation(chrome, executionContext, objectId) {
	return GET_ELEMENT_REGION.then(function(gerScript) {
		return callFunction(chrome, executionContext, gerScript, [{
			ELEMENT: objectId
		}]);
		/*
		return evaluate(chrome, executionContext, {
			expression: gerScript
		});
		*/
	});
}

function click(chrome, event, frame) {
	var frameId = frame.getFrameId(),
		executionContext = frame.getExecutionContext();
	resolveNode(chrome, event.id).then(function(obj) {
		var objInfo = obj.object,
			objectId = objInfo.objectId;

		return getElementClickableLocation(chrome, executionContext, objectId);
	}).then(function(i) {
		console.log('ok');
		console.log(i);
	}).catch(function(err) {
		console.log('error');
		console.error(err);
	});
	//console.log(event, frameId);
}

function evaluate(chrome, context, options) {
	return new Promise(function(resolve, reject) {
		chrome.Runtime.evaluate(_.extend({
			contextId: context.id
		}, options), function(err, result) {
			if(err) {
				reject(result);
			} else {
				resolve(result);
			}
		});
	});
}

function requestNode(chrome, objectId) {
	return new Promise(function(resolve, reject) {
		chrome.DOM.requestNode({
			objectId: objectId
		}, function(err, val) {
			if(err) {
				reject(val);
			} else {
				resovle(val);
			}
		});
	});
}

function resolveNode(chrome, nodeId) {
	return new Promise(function(resolve, reject) {
		chrome.DOM.resolveNode({
			nodeId: nodeId
		}, function(err, val) {
			if(err) {
				reject(val);
			} else {
				resolve(val);
			}
		});
	});
}

function readFile(filename) {
	return new Promise(function(resolve, reject) {
		fs.readFile(filename, { encoding: 'utf8' }, function(err, val) {
			if(err) { reject(err); }
			else { resolve(val); }
		});
	});
}

module.exports = {
	evaluate: evaluate,
	click: click
	//getElementValue: getElementValue
};
/*
Status WebViewImpl::CallFunction(const std::string& frame,
                                 const std::string& function,
                                 const base::ListValue& args,
                                 scoped_ptr<base::Value>* result) {
  std::string json;
  base::JSONWriter::Write(args, &json);
  // TODO(zachconrad): Second null should be array of shadow host ids.
  std::string expression = base::StringPrintf(
      "(%s).apply(null, [null, %s, %s])",
      kCallFunctionScript,
      function.c_str(),
      json.c_str());
  scoped_ptr<base::Value> temp_result;
  Status status = EvaluateScript(frame, expression, &temp_result);
  if (status.IsError())
    return status;

  return internal::ParseCallFunctionResult(*temp_result, result);
}
*/

/*
Status ExecuteGetElementValue(
    Session* session,
    WebView* web_view,
    const std::string& element_id,
    const base::DictionaryValue& params,
    scoped_ptr<base::Value>* value) {
  base::ListValue args;
  args.Append(CreateElement(element_id));
  return web_view->CallFunction(
      session->GetCurrentFrameId(),
      "function(elem) { return elem['value'] }",
      args,
      value);
}
*/

/*
Status ExecuteClickElement(
    Session* session,
    WebView* web_view,
    const std::string& element_id,
    const base::DictionaryValue& params,
    scoped_ptr<base::Value>* value) {
  std::string tag_name;
  Status status = GetElementTagName(session, web_view, element_id, &tag_name);
  if (status.IsError())
    return status;
  if (tag_name == "option") {
    bool is_toggleable;
    status = IsOptionElementTogglable(
        session, web_view, element_id, &is_toggleable);
    if (status.IsError())
      return status;
    if (is_toggleable)
      return ToggleOptionElement(session, web_view, element_id);
    else
      return SetOptionElementSelected(session, web_view, element_id, true);
  } else {
    WebPoint location;
    status = GetElementClickableLocation(
        session, web_view, element_id, &location);
    if (status.IsError())
      return status;

    std::list<MouseEvent> events;
    events.push_back(
        MouseEvent(kMovedMouseEventType, kNoneMouseButton,
                   location.x, location.y, session->sticky_modifiers, 0));
    events.push_back(
        MouseEvent(kPressedMouseEventType, kLeftMouseButton,
                   location.x, location.y, session->sticky_modifiers, 1));
    events.push_back(
        MouseEvent(kReleasedMouseEventType, kLeftMouseButton,
                   location.x, location.y, session->sticky_modifiers, 1));
    status =
        web_view->DispatchMouseEvents(events, session->GetCurrentFrameId());
    if (status.IsOk())
      session->mouse_position = location;
    return status;
  }
}
*/
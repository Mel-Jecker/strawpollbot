var token = ""; //The private token of the bot user

var Discordie = require("discordie");
var request = require('request');

var Events = Discordie.Events;

var maxOptions = 30;
var maxCharOptions = 200;
var maxCharTitle = 400;

var key = "!"; //First character before command. BEWARE THIS CAN ONLY BE ONE CHARACTER LONG OR ELSE THE BOT WILL NOT WORK

var client = new Discordie();

client.connect({ token: token });

client.Dispatcher.on(Events.GATEWAY_READY, e => {
    console.log("Connected as: " + client.User.username);
});

client.Dispatcher.on(Events.MESSAGE_CREATE, e => {
    var msgContent = e.message.content
    if (msgContent.startsWith(key + "poll ")) {
        var pattern = /^.poll\s(-{1,2}[^"]+\s)?("[^"]+"\s){2,}"[^"]+"$/;
        if (pattern.test(msgContent)) {
            var params = assemble(msgContent);
            var title = params[0];
            params = params.slice(1,params.length);
            try {
                var args = findArgs(msgContent);
                var multi = true;
                if (args.indexOf("multi") === -1){
                    multi = false;
                }
                var captcha = true;
                if (args.indexOf("captcha") === -1){
                    captcha = false;
                }
                createPoll(title,params,e.message.channel,multi,captcha);
            } catch (error) {
                e.message.channel.sendMessage("Error : " + error);
                help(e.message.channel);
            }
            //createPoll(title, options, e.message.channel, false,true);
        } else {
            help(e.message.channel);
        }
    } else if (msgContent.startsWith(key + "poll-help")) {
        help(e.message.channel);
    }
});

/**
 * 
 * @param {String} title 
 * @param {String[]} options 
 * @param {*} chan 
 * @param {boolean} multivote 
 * @param {boolean} captcha 
 */
function createPoll(title, options, chan, multivote, captcha) {
    if (options.length <= maxOptions) {
        if (checkOptions(options)) {
            if (title.length <= maxCharTitle) {
                var poll = { title: title, options: options, multi: multivote, captcha: captcha };
                request.post(
                    {
                        url: 'https://strawpoll.me/api/v2/polls',
                        followAllRedirects: true,
                        body: poll,
                        json: true

                    },
                    function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            chan.sendMessage("Here is your poll : https://www.strawpoll.me/" + body.id);
                        } else {
                            chan.sendMessage("Sorry, there seems to have been an error, please try again");
                            console.log("There was an error : " + response.statusCode);
                            console.log(error);
                        }
                    }
                );
            } else {
                e.message.channel.sendMessage("Error : title has more than " + maxCharTitle + " characters");
            }
        } else {
            e.message.channel.sendMessage("Error : an option has more than " + maxCharOptions + " characters");
        }
    } else {
        e.message.channel.sendMessage("Error : too much options (maximum is " + maxOptions + ")");
    }
}

function help(chan) {
    chan.sendMessage("Here is how to use this bot : \n````\n" + key + "poll [options] \"Title of the poll\" \"Option 1\" \"Option 2\" \"Option 3\" \"Etc..\"\n```\nThe options are : \n````\n    --captcha  -c     :  If this option is set, there will be a captcha in the poll\n    --multi    -m     :  If this option is set, it will be allowed to select multiple options\n```\nThere is a minimum of 2 and a maximum of 30 options, 200 characters per option maximum and 400 characters max for the title.\nType `" + key + "poll-help` to show this help.\nFor exemple : \n````\n" + key + "poll -c \"Yes or no ?\" \"Yes\" \"No\"\n```");
}

function checkOptions(options) {
    for (i = 0; i < options.length; i++) {
        var option = options[i];
        if (option.length > maxCharOptions) {
            return false;
        }
    }
    return true;
}
/**
 * This method returns the arguments of the command
 * @param {String} command The command the bot has received. It must already be checked with the regex : "/^.poll\s(-{1,2}[^"]+\s)?("[^"]+"\s){2,}"[^"]+"$/"
 * @return {String[]} the arguments of the command
 */
function findArgs(command) {
    command = command.replace(key + "poll ", "");
    var inQuotationMarks = false;
    var commandSplitted = command.split(" ");
    var args = [];
    commandSplitted.forEach(function (element) {
        if (element.startsWith("\"")) {
            inQuotationMarks = true;
        }
        if (!inQuotationMarks) {
            if (element.startsWith("--")) {
                var arg = element.replace("--", "");
                switch (element) {
                    case "multi":
                        args.push("multi");
                        break;
                    case "captcha":
                        args.push("captcha");
                        break;
                    default:
                        throw "invalid argument found";
                        break;
                }
            } else {
                var arg = element.replace("-", "");
                var argsFound = arg.split("");
                argsFound.forEach(function (elementArg) {
                    switch (elementArg) {
                        case "m":
                            args.push("multi");
                            break;
                        case "c":
                            args.push("captcha");
                            break;
                        default:
                            throw "invalid argument found";
                            break;
                    }
                }, this);
            }
        }
        if (element.endsWith("\"")) {
            inQuotationMarks = false;
        }
    }, this);
    return args;
}

/**
 * This method is used to assemble the parameters of the command
 * @param {String} command The command the bot has received. It must already be checked with the regex : "/^.poll\s(-{1,2}[^"]+\s)?("[^"]+"\s){2,}"[^"]+"$/"
 * @return {String[]} the parameters of the command
 */
function assemble(command) {
    command = command.replace(key + "poll ", "");
    var commandSplitted = command.split(" ");
    var result = [];
    var inQuotationMarks = false;
    var counter = 0;
    var paramNow = "";
    commandSplitted.forEach(function (element) {
        if (element.startsWith("\"")) {
            inQuotationMarks = true;
        }
        if (inQuotationMarks){
            paramNow += element + " ";
        }
        if (element.endsWith("\"")) {
            inQuotationMarks = false;
            paramNow = paramNow.slice(0,paramNow.length - 1);
            paramNow = paramNow.replace("\"","").replace("\"","");
            result.push(paramNow);
            paramNow = "";
        }

    }, this);
    return result;
}

(function (window) {
    'use strict';
    function define_ALApiService() {
        var ALApiService = {};
        var MCK_APP_ID = "";
        var mckUtils = new MckUtils();
        var MCK_BASE_URL = "https://apps.applozic.com";
        var INITIALIZE_APP_URL = "/v2/tab/initialize.page";
        var MESSAGE_LIST_URL = "/rest/ws/message/list";
        var MESSAGE_SEND_URL = "/rest/ws/message/send";
        var GROUP_CREATE_URL = "/rest/ws/group/create";
        var GROUP_LIST_URL = "/rest/ws/group/list";
        var GROUP_INFO_URL = "/rest/ws/group/v2/info";
        var GROUP_ADD_MEMBER_URL = "/rest/ws/group/add/member";
        var GROUP_REMOVE_MEMBER_URL = "/rest/ws/group/remove/member";
        var GROUP_LEFT_URL = "/rest/ws/group/left";
        var GROUP_UPDATE_URL = "/rest/ws/group/update";
        var GROUP_IS_USER_PRESENT_URL = "/rest/ws/group/check/user";
        var GROUP_USER_COUNT_URL = "/rest/ws/group/user/count";
        var FRIEND_LIST_URL ="/rest/ws/group/";
        var GET_USER_DETAIL_URL ="/rest/ws/user/v2/detail";
        var UPDATE_USER_DETAIL_URL ="/rest/ws/user/update";
        var USER_FILTER ="/rest/ws/user/filter";
        var USER_BLOCK_URL ="/rest/ws/user/block";
        var USER_UNBLOCK_URL ="/rest/ws/user/unblock";
        var UPDATE_PASSWORD_URL ="/rest/ws/user/update/password";
        var UPDATE_REPLY_MAP = "/rest/ws/message/detail";
        var MESSAGE_DELETE_URL = "/rest/ws/message/delete";
        var MESSAGE_READ_UPDATE_URL = "/rest/ws/message/read";
        var MESSAGE_DELIVERY_UPDATE_URL = "/rest/ws/message/delivered";
        var CONVERSATION_CLOSE_UPDATE_URL = "/rest/ws/conversation/close";
        var FILE_PREVIEW_URL = "/rest/ws/aws/file";
        var FILE_UPLOAD_URL = "/rest/ws/aws/file/url";
        var FILE_AWS_UPLOAD_URL = "/rest/ws/upload/file";
        var FILE_DELETE_URL = "/rest/ws/aws/file/delete";
        var MESSAGE_ADD_INBOX_URL = "/rest/ws/message/add/inbox";
        var CONVERSATION_READ_UPDATE_URL = "/rest/ws/message/read/conversation";
        var CONVERSATION_DELETE_URL = "/rest/ws/message/delete/conversation";


        function getAsUriParameters(data) {
            var url = '';
            for (var prop in data) {
                url += encodeURIComponent(prop) + '=' +
                    encodeURIComponent(data[prop]) + '&';
            }
            return url.substring(0, url.length - 1)
        }

        ALApiService.initServerUrl = function (serverUrl) {
            MCK_BASE_URL = serverUrl;
        }


        /**
         * Login user to the chat session, must be done once in a session.
         * Usage Example:
         * Applozic.ALApiService.login({data: {alUser: {userId: 'debug4', password: 'debug4', appVersionCode: 108, applicationId: 'applozic-sample-app'}}, success: function(response) {console.log(response);}, error: function() {}});
         */
        ALApiService.login = function (options) {
            MCK_APP_ID = options.data.alUser.applicationId;
            MCK_BASE_URL = options.data.baseUrl;

            mckUtils.ajax({
                url: MCK_BASE_URL + INITIALIZE_APP_URL,
                type: 'post',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                data: JSON.stringify(options.data.alUser),
                contentType: 'application/json',
                headers: {
                    'Application-Key': MCK_APP_ID
                },
                success: function (response) {
                    mckUtils.setEncryptionKey(response.encryptionKey);
                    var AUTH_CODE = btoa(response.userId + ':' + response.deviceKey);
                    mckUtils.setAjaxHeaders(AUTH_CODE, MCK_APP_ID, response.deviceKey, options.data.alUser.password, options.data.alUser.appModuleName);

                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }

        /**
         * Get messages list.
         * 
         * Usage Examples:
         * 
         * Get latest messages group by users and groups:
         * Applozic.ALApiService.getMessages({data: {}, success: function(response) {console.log(response);}, error: function() {}});
         * 
         * Messages between logged in user and a specific userId:
         * Applozic.ALApiService.getMessages({data: {userId: 'debug4'}, success: function(response) {console.log(response);}, error: function() {}});
         * 
         * Messages between logged in user and a specific groupId:
         * Applozic.ALApiService.getMessages({data: {groupId: 5694841}, success: function(response) {console.log(response);}, error: function() {}});
         * 
         * Messages history before a timestamp, for loading message list, pass the endTime = createdAt of the last message received in the message list api response
         * Applozic.ALApiService.getMessages({data: {userId: 'debug4', endTime: 1508177918406}, success: function(response) {console.log(response);}, error: function() {}});
         */
        ALApiService.getMessages = function (options) {
            if (options.data.userId || options.data.groupId) {
                if (options.data.pageSize === 'undefined') {
                    options.data.pageSize = 30;
                }
            } else if (typeof options.data.mainPageSize === 'undefined') {
                options.data.mainPageSize = 60;
            }
            var data = getAsUriParameters(options.data);
            var response = new Object();
            mckUtils.ajax({
                url: MCK_BASE_URL + MESSAGE_LIST_URL + "?" + data,
                async: (typeof options.async !== 'undefined') ? options.async : true,
                type: 'get',
                success: function (data) {
                    response.status = "success";
                    response.data = data;
                    if (options.success) {
                        options.success(response);
                    }
                    return;
                },
                error: function (xhr, desc, err) {
                    response.status = "error";
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }

        /**
         * Usage Example:
	 * Send message to a user (to)
         * Applozic.ALApiService.sendMessage({data: {message: {"type":5,"contentType":0,"message":"hi","to":"debug4","metadata":{},"key":"mpfj2","source":1}}, success: function(response) {console.log(response);}, error: function() {}});
         * Send message to a group using groupId
         * Applozic.ALApiService.sendMessage({data: {message: {"type":5,"contentType":0,"message":"hi","groupId":"group-1","metadata":{},"key":"mpfj2","source":1}}, success: function(response) {console.log(response);}, error: function() {}});
         * Send message to a group using clientGroupId
         * Applozic.ALApiService.sendMessage({data: {message: {"type":5,"contentType":0,"message":"hi","clientGroupId":"group-1","metadata":{},"key":"mpfj2","source":1}}, success: function(response) {console.log(response);}, error: function() {}});
	 * type: 5 - Sent Message, 4 - Received Message
         * contentType: 0 - Standard Chat Message
         * to: userId to whom the message is to be sent
         * metadata: Additional key value pairs
         * source (optional): 1 - WEB, 5 - DESKTOP_BROWSER, 6 - MOBILE_BROWSER
         */
        ALApiService.sendMessage = function (options) {
            mckUtils.ajax({
                type: 'POST',
                url: MCK_BASE_URL + MESSAGE_SEND_URL,
                global: false,
                data: JSON.stringify(options.data.message),
                async: (typeof options.async !== 'undefined') ? options.async : true,
                contentType: 'application/json',
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }

        /**
         * Send delivery report for a message.
         * Usage Example:
         * Applozic.ALApiService.sendDeliveryUpdate({data: {key: '5-f4c7860c-684a-4204-942d-2ccd2375f4a0-1508588649594'}, success: function(response) {console.log(response);}, error: function() {}});
         */
        ALApiService.sendDeliveryUpdate = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + MESSAGE_DELIVERY_UPDATE_URL,
                data: "key=" + options.data.key,
                global: false,
                type: 'get',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }

        /**
         * Send read report for a message.
         * Usage Example:
         * Applozic.ALApiService.sendReadUpdate({data: {key: '5-f4c7860c-684a-4204-942d-2ccd2375f4a0-1508588649594'}, success: function(response) {console.log(response);}, error: function() {}});
         */
        ALApiService.sendReadUpdate = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + MESSAGE_READ_UPDATE_URL,
                data: "key=" + options.data.key,
                global: false,
                type: 'get',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }

        /**
         * Delete message
         * Usage Example:
         * Applozic.ALApiService.deleteMessage({data: {key: '5-f4c7860c-684a-4204-942d-2ccd2375f4a0-1508588649594'}, success: function(response) {console.log(response);}, error: function() {}});
         */
        ALApiService.deleteMessage = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + MESSAGE_DELETE_URL + "?key=" + options.data.key,
                global: false,
                type: 'get',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }

        /**
         * Reply to a particular message
         * Usage Example:
         * Applozic.ALApiService.updateReplyMessage({data: {key: '5-f4c7860c-684a-4204-942d-2ccd2375f4a0-1508588649594'}, success: function(response) {console.log(response);}, error: function() {}});
         */
        ALApiService.updateReplyMessage = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + UPDATE_REPLY_MAP + "?keys=" + options.data.key,
                type: 'get',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }

        /**
         * Delete conversation thread of the logged in user with a particular user or group.
         * Usage Example:
         * 
         * Delete by userId
         * Applozic.ALApiService.deleteConversation({data: {userId: 'debug2'}, success: function(response) {console.log(response);}, error: function() {}});
         * Delete by groupId
         * Applozic.ALApiService.deleteConversation({data: {groupId: 5694841}, success: function(response) {console.log(response);}, error: function() {}});
         */
        ALApiService.deleteConversation = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + CONVERSATION_DELETE_URL,
                type: "get",
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                data: getAsUriParameters(options.data),
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }

        /**
         * Create group
         * Usage Example:
         * Applozic.ALApiService.createGroup({data: {group: {"groupName":"test","users":[{'userId': 'debug3'}, {'userId': 'debug4'}],"type":2,"metadata":{"CREATE_GROUP_MESSAGE":":adminName created group :groupName","REMOVE_MEMBER_MESSAGE":":adminName removed :userName","ADD_MEMBER_MESSAGE":":adminName added :userName","JOIN_MEMBER_MESSAGE":":userName joined","GROUP_NAME_CHANGE_MESSAGE":"Group name changed to :groupName","GROUP_ICON_CHANGE_MESSAGE":"Group icon changed","GROUP_LEFT_MESSAGE":":userName left","DELETED_GROUP_MESSAGE":":adminName deleted group","GROUP_USER_ROLE_UPDATED_MESSAGE":":userName is :role now","GROUP_META_DATA_UPDATED_MESSAGE":"","ALERT":"","HIDE":""}} }, success: function(response) {console.log(response);}, error: function() {}});
         */
        ALApiService.createGroup = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + GROUP_CREATE_URL,
                global: false,
                data: JSON.stringify(options.data.group),
                type: 'post',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                contentType: 'application/json',
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }

        /**
         * Get groups list.
         * Usage Example:
         * Applozic.ALApiService.loadGroups({success: function(response) {console.log(response);} });
         */
        ALApiService.loadGroups = function (options) {
            if (options.baseUrl) {
                MCK_BASE_URL = options.baseUrl;
            }
            mckUtils.ajax({
                url: MCK_BASE_URL + GROUP_LIST_URL,
                type: 'get',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }
        /**
         * Get groups info.
         * Usage Example:
         * Applozic.ALApiService.getGroupInfo({group:{groupId:"236215"}, success: function(response){console.log(response);}, error: function() {}});
         */
        ALApiService.getGroupInfo = function (options) {
            var groupId = (options.data.group.groupId)? "?groupId="+options.data.group.groupId : "?clientGroupId="+options.group.clientGroupId;
            mckUtils.ajax({
                url: MCK_BASE_URL + GROUP_INFO_URL+ groupId,
                type: 'get',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }  
       /**
         * Add Group Member to Group.
         * Usage Example:
         * Applozic.ALApiService.addGroupMember({data:{group:{"userId":"user unique identifier",
                                                     "clientGroupId":"group unique identifier" }},
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */
        ALApiService.addGroupMember = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + GROUP_ADD_MEMBER_URL,
                type: 'POST',
                data: JSON.stringify(options.data.group),
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                contentType: 'application/json',
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }  
        
        /**
         * Remove Group Member from Group.
         * Usage Example:
         * Applozic.ALApiService.removeGroupMember({data:{group:{"userId":"user unique identifier ",
                                                     "clientGroupId":"group unique identifier" }},
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */

        ALApiService.removeGroupMember = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + GROUP_REMOVE_MEMBER_URL,
                type: 'POST',
                data: JSON.stringify(options.data.group),
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                contentType: 'application/json',
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }  

        /**
         * Group Left
         * Usage Example:
         * Applozic.ALApiService.groupLeave({data:{group:{"clientGroupId":"group unique identifier" }},
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */

        ALApiService.groupLeave = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + GROUP_LEFT_URL,
                type: 'POST',
                data: JSON.stringify(options.data.group),
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                contentType: 'application/json',
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }  

         /**
         * Group Update
         * Usage Example:
         * Applozic.ALApiService.groupUpdate({data:{group:{groupId:groupId or clientGroupId:"clientGroupId",newName:"New name of group",imageUrl:"image url of the group"}},
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */

        ALApiService.groupUpdate = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + GROUP_UPDATE_URL,
                type: 'POST',
                data: JSON.stringify(options.data.group),
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                contentType: 'application/json',
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        } 
        
         /**
         * Check if user is part of a Group
         * Usage Example:
         * Applozic.ALApiService.isUserPresentInGroup({data:{clientGroupId:"clientGroupId",userId:"userId"},
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */

        ALApiService.isUserPresentInGroup = function (options) {           
            mckUtils.ajax({
                url: MCK_BASE_URL + GROUP_IS_USER_PRESENT_URL+ '?userId='+options.data.userId+'&clientGroupId='+options.data.clientGroupId,
                type: 'get',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }  

        /**
         * Group Users Count
         * Usage Example:
         * Applozic.ALApiService.groupUserCount({data:{clientGroupId:["clientGroupId1","clientGroupId2"]},
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */

        ALApiService.groupUserCount = function (options) {           
            mckUtils.ajax({
                url: MCK_BASE_URL + GROUP_USER_COUNT_URL+ '?clientGroupIds='+options.data.clientGroupId,
                type: 'get',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        } 
        
         /**
         * Group Delete
         * Usage Example:
         * Applozic.ALApiService.groupDelete({data:{clientGroupId:"clientGroupId"},
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */

        ALApiService.groupDelete = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + GROUP_LEFT_URL+"?clientGroupId="+options.data.clientGroupId,
                type: 'GET',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }  
        /**
         * Create User FriendList
         * Usage Example:
         * Applozic.ALApiService.createUserFriendList({data:{groupName:"groupName"},
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */
        ALApiService.createUserFriendList = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + FRIEND_LIST_URL+options.data.group.groupName+"/add/",
                type: 'POST',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                data: JSON.stringify(options.data.group.groupMemberList),
                contentType: 'application/json',
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                        ALStorage.setFriendListGroupName(options.data.group.groupName);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }  
 /**
         * Create Open FriendList
         * Usage Example:
         * Applozic.ALApiService.createOpenFriendList({data:{group:{groupName:"groupName",type: 9,
                                                groupMemberList: ["debug2", "debug3","videocall-1"]}},
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */
        ALApiService.createOpenFriendList = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + FRIEND_LIST_URL+options.data.group.groupName+"/add/members",
                type: 'POST',
                data: JSON.stringify(options.data.group),
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                contentType: 'application/json',
                success: function (response) {
                    if (options.success) {
                        options.success(response);
                        ALStorage.setFriendListGroupName(options.data.group.groupName);
                        ALStorage.setFriendListGroupType(options.data.group.type);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        } 
        /**
         * Get FriendList
         * Usage Example:
         * Applozic.ALApiService.getFriendList({data:{groupName:"groupName",type: 9,
                                                groupMemberList: ["debug2", "debug3","videocall-1"]},
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */
        ALApiService.getFriendList = function (options) {
            var getFriendListUrl = (options.data.type!=="null")?"/get?groupType=9":"/get";
            options.data.url =options.data.url? options.data.url:getFriendListUrl;
            mckUtils.ajax({
                url: MCK_BASE_URL + FRIEND_LIST_URL +options.data.groupName +options.data.url,
                type: 'GET',
                async: (typeof options.data.async !== 'undefined') ? options.data.async : true,
                global: false,
                contentType: 'application/json',
                success: function (response) {
                    if (options.success) {
                        console.log(response);
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }    

 /**
         * remove user from friendList
         * Usage Example:
         * Applozic.ALApiService.removeUserFromFriendList({group:{groupName:"groupname",userId:"userid",type:9},
                                                      success: function(response) {console.log(response);}, error: function() {}});
         */
        ALApiService.removeUserFromFriendList = function (options) {
            var getFriendListUrl = (options.group.type)?"/remove?userId="+options.group.userId+"&groupType=9":"/remove?userId="+options.group.userId;
            mckUtils.ajax({
                url: MCK_BASE_URL +FRIEND_LIST_URL+options.group.groupName+getFriendListUrl,
                type: 'Post',
                contentType: 'application/json',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                success: function (response) {
                    if (options.success) {
                        console.log(response);
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }    

        /**
         * delete friendList
         * Usage Example:
         * Applozic.ALApiService.deleteFriendList({group:{groupName:"groupname",userId:"userid",type:9},
                                                      success: function(response) {console.log(response);}, error: function() {}});
         */
        ALApiService.deleteFriendList = function(options) {
            var getFriendListUrl =(options.group.type)?"/delete?groupType=9":"/delete";
            mckUtils.ajax({
                             url: MCK_BASE_URL +FRIEND_LIST_URL+options.group.groupName+getFriendListUrl,
                             type: "GET",
                             async:false,
                             contentType: "application/json",
                             async: (typeof options.async !== 'undefined') ? options.async : true,
                             success: function (response) {
                                if (options.success) {
                                    console.log(response);
                                    options.success(response);
                                }
                            },
                            error: function (response) {
                                if (options.error) {
                                    options.error(response);
                                }
                            }
                          });
                        };
         /**
         * Get User Detail
         * Usage Example:
         * Applozic.ALApiService.getUserDetail({data:{userIdList:["userId1","userId2"]},
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */
        ALApiService.getUserDetail = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + GET_USER_DETAIL_URL,
                data: JSON.stringify({
                    userIdList: options.data.userIdList
                }),
                type:'POST',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                contentType: 'application/json',
                success: function (response) {
                    if (options.success) {
                        console.log(response);
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }  
         /**
         * Update User Detail
         * Usage Example:
         * Applozic.ALApiService.updateUserDetail({data:{email:"user email", displayName:"user display name",imageLink:"User profile image url", statusMessage:"status Message"},
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */
        ALApiService.updateUserDetail = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + UPDATE_USER_DETAIL_URL,
                data: JSON.stringify(options.data),
                type:'POST',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                contentType:'application/json',
                success: function (response) {
                    if (options.success) {
                        console.log(response);
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }  
/**
         * Update Password
         * Usage Example:
         * Applozic.ALApiService.updatePassword({data:{oldPassword:"oldPassword", newPassword:"newPassword"},
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */
        ALApiService.updatePassword = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + UPDATE_PASSWORD_URL+"?oldPassword="+options.data.oldPassword+"&newPassword="+options.data.newPassword,
                type:'GET',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                success: function (response) {
                    if (options.success) {
                        console.log(response);
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }

        /**
         * Get Contact List
         * Usage Example:
         * Applozic.ALApiService.getContactList({url:"url",
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */
        ALApiService.getContactList = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + USER_FILTER+options.url,
                type:'GET',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                success: function (response) {
                    if (options.success) {
                        console.log(response);
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }
/**
         * Block User
         * Usage Example:
         * Applozic.ALApiService.blockUser({data:{userId:"userId",isBlock:true},
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */

        ALApiService.blockUser = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + USER_BLOCK_URL+"?userId="+options.data.userId+ "&block=" +options.data.isBlock,
                type:'GET',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                success: function (response) {
                    if (options.success) {
                        console.log(response);
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }
        
        /**
         * UnBlock User
         * Usage Example:
         * Applozic.ALApiService.unBlockUser({data:{userId:"userId"},
                                                      success: function(response) {console.log(response);}, error: function() {} });
         */

        ALApiService.unBlockUser = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + USER_UNBLOCK_URL+"?userId="+options.data.userId,
                type:'GET',
                async: (typeof options.async !== 'undefined') ? options.async : true,
                global: false,
                success: function (response) {
                    if (options.success) {
                        console.log(response);
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }


 /**
         * SendConversationCloseUpdate
         * Usage Example:
         window.Applozic.ALApiService.sendConversationCloseUpdate({conversationId:conversationId, success: function (result) {}, error: function () {} });
         */

        ALApiService.sendConversationCloseUpdate = function(options) {
                var data = "id=" + options.conversationId;
                mckUtils.ajax({
                    url: MCK_BASE_URL + CONVERSATION_CLOSE_UPDATE_URL,
                    data: data,
                    global: false,
                    type: 'get',
                    success: function() {},
                    error: function() {}
                });
        };
           
        /**
         * FileUpload
         * Usage Example:
          window.Applozic.ALApiService.fileUpload({data:{ url: url} , success: function (result) {}, error: function () { } });
         */

        ALApiService.fileUpload = function (options) {
            mckUtils.ajax({
                type : "GET",
                url : options.data.url,
                global : false,
                data : "data=" + new Date().getTime(),
                crosDomain : true,
                success: function (response) {
                    if (options.success) {
                        console.log(response);
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        }

/**
         * DeleteFileMeta
         * Usage Example:
          window.Applozic.ALApiService.deleteFileMeta({data:{url:url} , success: function (result) {}, error: function () { } });
         */
        ALApiService.deleteFileMeta = function(options) {
            mckUtils.ajax({
                url: options.data.url,
                type: 'post',
                success: function (response) {
                    if (options.success) {
                        console.log(response);
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        };

/**
         * addMessageInbox
         * Usage Example:
          window.Applozic.ALApiService.addMessageInbox({data:{sender:"sender",messageContent:"Welcome"} , success: function (result) {}, error: function () { } });
         */

        ALApiService.addMessageInbox = function (options) {
            mckUtils.ajax({
                type: 'GET',
                url: MCK_BASE_URL + MESSAGE_ADD_INBOX_URL,
                global: false,
                data: 'sender=' + encodeURIComponent(options.data.sender) + "&messageContent=" + encodeURIComponent(options.data.messageContent),
                contentType: 'text/plain',
                success: function (response) {
                    if (options.success) {
                        console.log(response);
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        options.error(response);
                    }
                }
            });
        };  
/**
         * conversationReadUpdate
         * Usage Example:
          window.Applozic.ALApiService.conversationReadUpdate({data: "groupId=groupId"/"userId=encodeURIComponent(userId)" , success: function (result) {}, error: function () { } });
         */

        ALApiService.conversationReadUpdate = function (options) {
            mckUtils.ajax({
                url: MCK_BASE_URL + CONVERSATION_READ_UPDATE_URL,
                data: options.data,
                global: false,
                type: 'get',
                success: function (response) {
                    if (options.success) {
                        console.log(response);
                        options.success(response);
                    }
                },
                error: function (response) {
                    if (options.error) {
                        console.log(response);
                        options.success(response);
                    }
                }
            });
        }

        /**
         * sendSubscriptionIdToServer
         * Usage Example:
          window.Applozic.ALApiService.sendSubscriptionIdToServer({data: {"subscriptionId":subscriptionId}, success: function (result) {}, error: function () { } });
         */

        ALApiService.sendSubscriptionIdToServer = function (options) {
            var subscriptionId=options.data.subscriptionId ;
            mckUtils.ajax({
                url: MCK_BASE_URL + MCK_SW_REGISTER_URL,
                type: 'post',
                data: 'registrationId=' + subscriptionId,
                success: function(data) {},
                error: function(xhr, desc, err) {
                    if (xhr.status === 401) {
                        sessionStorage.clear();
                        console.log('Please reload page.');
                    }
                }
            });
        }


        return ALApiService;
    }

    //define globally if it doesn't already exist
    if (typeof (ALApiService) === 'undefined') {
        window.Applozic.ALApiService = define_ALApiService();
    }
    else {
        console.log("ALApiService already defined.");
    }
})(window);

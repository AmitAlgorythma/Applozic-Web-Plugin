function MckInitializeChannel($this) {
    var _this = this;
    var MCK_APP_ID;
    var events = $this.events;
    var subscriber = null;
    var stompClient = null;
    var TYPING_TAB_ID = '';
    var typingSubscriber = null;
    var openGroupSubscriber = [];
    var checkConnectedIntervalId;
    var sendConnectedStatusIntervalId;
    var SOCKET = '';
    var mck_sidebox = document.getElementById("mck-sidebox");
    var mck_tab_title = document.getElementById("mck-tab-title");
    var mck_typing_box = document.getElementsByClassName('mck-typing-box')[0];
    var mck_tab_status = document.getElementById("mck-tab-status");
    var mck_offline_message_box = document.getElementById("mck-offline-message-box");
    var mck_typing_label = document.getElementById("mck-typing-label");
    var mck_message_inner = document.getElementById("mck-message-cell").getElementsByClassName("mck-message-inner")[0];
    _this.init = function(appId) {
        _this.MCK_APP_ID = appId;
        if (typeof MCK_WEBSOCKET_URL !== 'undefined') {
            var port = (!mckUtils.startsWith(MCK_WEBSOCKET_URL, "https")) ? "15674" : "15675";
            if (typeof w.SockJS === 'function') {
                if (!SOCKET) {
                    SOCKET = new SockJS(MCK_WEBSOCKET_URL + ":" + port + "/stomp");
                }
                stompClient = w.Stomp.over(SOCKET);
                stompClient.heartbeat.outgoing = 0;
                stompClient.heartbeat.incoming = 0;
                stompClient.onclose = function() {
                    _this.disconnect();
                };
                stompClient.connect("guest", "guest", _this.onConnect, _this.onError, '/');
                w.addEventListener("beforeunload", function(e) {
                    _this.disconnect();
                });
            }
        }
    };
    _this.checkConnected = function(isFetchMessages) {
        if (stompClient.connected) {
            if (checkConnectedIntervalId) {
                clearInterval(checkConnectedIntervalId);
            }
            if (sendConnectedStatusIntervalId) {
                clearInterval(sendConnectedStatusIntervalId);
            }
            checkConnectedIntervalId = setInterval(function() {
                _this.connectToSocket(isFetchMessages);
            }, 600000);
            sendConnectedStatusIntervalId = setInterval(function() {
                _this.sendStatus(1);
            }, 1200000);
        } else {
            _this.connectToSocket(isFetchMessages);
        }
    };
    _this.connectToSocket = function(isFetchMessages) {
        if (!stompClient.connected) {
            if (isFetchMessages && mck_sidebox.style.display === 'block') {
                var currTabId = $mck_message_inner.data('mck-id');
                if (currTabId) {
                    var isGroup = $mck_message_inner.data('isgroup');
                    var conversationId = $mck_message_inner.data('mck-conversationid');
                    var topicId = $mck_message_inner.data('mck-topicid');
                    ALStorage.clearMckMessageArray();
                    mckMessageLayout.loadTab({
                        'tabId': currTabId,
                        'isGroup': isGroup,
                        'conversationId': conversationId,
                        'topicId': topicId
                    });
                } else {
                    ALStorage.clearMckMessageArray();
                    mckMessageLayout.loadTab({
                        'tabId': '',
                        'isGroup': false
                    });
                }
            }
            _this.init();
        }
    };
    _this.stopConnectedCheck = function() {
        if (checkConnectedIntervalId) {
            clearInterval(checkConnectedIntervalId);
        }
        if (sendConnectedStatusIntervalId) {
            clearInterval(sendConnectedStatusIntervalId);
        }
        checkConnectedIntervalId = '';
        sendConnectedStatusIntervalId = '';
        _this.disconnect();
    };
    _this.disconnect = function() {
        if (stompClient && stompClient.connected) {
            _this.sendStatus(0);
            stompClient.disconnect();
        }
    };
    _this.unsubscibeToTypingChannel = function() {
        if (stompClient && stompClient.connected) {
            if (typingSubscriber) {
                if (MCK_TYPING_STATUS === 1) {
                    _this.sendTypingStatus(0, TYPING_TAB_ID);
                }
                typingSubscriber.unsubscribe();
            }
        }
        typingSubscriber = null;
    };
    _this.unsubscibeToNotification = function() {
        if (stompClient && stompClient.connected) {
            if (subscriber) {
                subscriber.unsubscribe();
            }
        }
        subscriber = null;
    };
    _this.subscibeToTypingChannel = function(subscribeId) {
        if (stompClient && stompClient.connected) {
            typingSubscriber = stompClient.subscribe("/topic/typing-" + MCK_APP_ID + "-" + subscribeId, _this.onTypingStatus);
        } else {
            _this.reconnect();
        }
    };
    _this.subscribeToOpenGroup = function(group) {
        if (stompClient && stompClient.connected) {
            var subs = stompClient.subscribe("/topic/group-" + MCK_APP_ID + "-" + group.contactId, _this.onOpenGroupMessage);
            openGroupSubscriber.push(subs.id);
            OPEN_GROUP_SUBSCRIBER_MAP[group.contactId] = subs.id;
        } else {
            _this.reconnect();
        }
    };
    _this.sendTypingStatus = function(status, tabId) {
        if (stompClient && stompClient.connected) {
            if (status === 1 && MCK_TYPING_STATUS === 1) {
                stompClient.send('/topic/typing-' + MCK_APP_ID + "-" + TYPING_TAB_ID, {
                    "content-type": "text/plain"
                }, MCK_APP_ID + "," + MCK_USER_ID + "," + status);
            }
            if (tabId) {
                if (tabId === TYPING_TAB_ID && status === MCK_TYPING_STATUS && status === 1) {
                    return;
                }
                TYPING_TAB_ID = tabId;
                stompClient.send('/topic/typing-' + MCK_APP_ID + "-" + tabId, {
                    "content-type": "text/plain"
                }, MCK_APP_ID + "," + MCK_USER_ID + "," + status);
                setTimeout(function() {
                    MCK_TYPING_STATUS = 0;
                }, 60000);
            } else if (status === 0) {
                stompClient.send('/topic/typing-' + MCK_APP_ID + "-" + TYPING_TAB_ID, {
                    "content-type": "text/plain"
                }, MCK_APP_ID + "," + MCK_USER_ID + "," + status);
            }
            MCK_TYPING_STATUS = status;
        }
    };
    _this.onTypingStatus = function(resp) {
        if (typingSubscriber != null && typingSubscriber.id === resp.headers.subscription) {
            var message = resp.body;
            var publisher = message.split(",")[1];
            var status = Number(message.split(",")[2]);
            var tabId = resp.headers.destination.substring(resp.headers.destination.lastIndexOf("-") + 1, resp.headers.destination.length);
            var currTabId = $mck_message_inner.data('mck-id');
            var isGroup = $mck_message_inner.data('isgroup');
            var group = mckGroupUtils.getGroup(currTabId);
            if (!MCK_BLOCKED_TO_MAP[publisher] && !MCK_BLOCKED_BY_MAP[publisher]) {
                if (status === 1) {
                    if ((MCK_USER_ID !== publisher || !isGroup) && (currTabId === publisher || currTabId === tabId)) {
                        var isGroup = $mck_message_inner.data('isgroup');
                        if (isGroup) {
                            if (publisher !== MCK_USER_ID) {
                                if (mckGroupLayout.authenticateGroupUser(group) || (group.type === 6 && !MCK_OPEN_GROUP_SETTINGS.disableChatForNonGroupMember)) {
                                    mck_tab_title.classList.add('mck-tab-title-w-typing');
                                    mck_tab_status.classList.remove('vis').add('n-vis');
                                    var displayName = mckMessageLayout.getTabDisplayName(publisher, false);
                                    displayName = displayName.split(' ')[0];
                                    mck_typing_label.innerHTML = displayName + ' ' + MCK_LABELS['is.typing'];
                                }
                                if (group.type === 7) {
                                    mck_tab_title.classList.add('mck-tab-title-w-typing');
                                    mck_typing_label.innerHTML = MCK_LABELS['is.typing'];
                                    mck_tab_status.innerHTML = '';
                                }
                            }
                        } else {
                            mck_tab_title.classList.add('mck-tab-title-w-typing');
                            mck_tab_status.classList.remove('vis').add('n-vis');
                            mck_typing_label.innerHTML = MCK_LABELS['typing'];
                        }
                        mck_typing_box.classList.remove('n-vis').add('vis');
                        setTimeout(function() {
                            mck_tab_title.classList.remove("mck-tab-title-w-typing");
                            mck_typing_box.classList.remove('vis').add('n-vis');
                            if (mck_tab_title.classList.contains("mck-tab-title-w-status" && (typeof group === "undefined" || group.type != 7))) {
                                mck_tab_status.classList.remove('n-vis').add('vis');
                            }
                            mck_typing_label.innerHTML = MCK_LABELS['typing'];
                        }, 60000);
                    }
                } else {
                    mck_tab_title.classList.remove("mck-tab-title-w-typing");
                    mck_typing_box.classList.remove('vis').add('n-vis');
                    if (mck_tab_title.classList.contains("mck-tab-title-w-status") && (typeof group === "undefined" || group.type != 7)) {
                        mck_tab_status.classList.remove('n-vis').add('vis');
                    }
                    mck_typing_label.innerHTML = MCK_LABELS['typing'];
                }
            }
        }
    };
    _this.reconnect = function() {
        _this.unsubscibeToTypingChannel();
        _this.unsubscibeToNotification();
        _this.disconnect();
        _this.init();
    };
    _this.onError = function(err) {
        w.console.log("Error in channel notification. " + err);
        events.onConnectFailed();
    };
    _this.sendStatus = function(status) {
        if (stompClient && stompClient.connected) {
            stompClient.send('/topic/status-v2', {
                "content-type": "text/plain"
            }, MCK_TOKEN + "," + USER_DEVICE_KEY + "," + status);
        }
    };
    _this.onConnect = function() {
        if (stompClient.connected) {
            if (subscriber) {
                _this.unsubscibeToNotification();
            }
            subscriber = stompClient.subscribe("/topic/" + MCK_TOKEN, _this.onMessage);
            _this.sendStatus(1);
            _this.checkConnected(true);
        } else {
            setTimeout(function() {
                subscriber = stompClient.subscribe("/topic/" + MCK_TOKEN, _this.onMessage);
                _this.sendStatus(1);
                _this.checkConnected(true);
            }, 5000);
        }
        events.onConnect();
    };
    _this.onOpenGroupMessage = function(obj) {
        if (openGroupSubscriber.indexOf(obj.headers.subscription) !== -1) {
            var resp = $applozic.parseJSON(obj.body);
            var messageType = resp.type;
            var message = resp.message;
            // var userIdArray =
            // mckMessageLayout.getUserIdFromMessage(message);
            // mckContactService.getContactDisplayName(userIdArray);
            // mckMessageLayout.openConversation();
            if (messageType === "APPLOZIC_03") {
                ALStorage.updateLatestMessage(message);
                if (message.type !== 0 && message.type !== 4) {
                    $applozic("." + message.key + " .mck-message-status").removeClass('mck-icon-time').addClass('mck-icon-sent');
                    mckMessageLayout.addTooltip(message.key);
                }
                events.onMessageSentUpdate({
                    'messageKey': message.key
                });
            } else if (messageType === "APPLOZIC_01" || messageType === "APPLOZIC_02" || messageType === "MESSAGE_RECEIVED") {
                ALStorage.updateLatestMessage(message);
                var contact = (message.groupId) ? mckGroupUtils.getGroup(message.groupId) : mckMessageLayout.getContact(message.to);
                var mck_sidebox_content = document.getElementById("mck-sidebox-content");
                var tabId = $mck_message_inner.data('mck-id');
                if (messageType === "APPLOZIC_01" || messageType === "MESSAGE_RECEIVED") {
                    var messageFeed = mckMessageLayout.getMessageFeed(message);
                    events.onMessageReceived({
                        'message': messageFeed
                    });
                } else if (messageType === "APPLOZIC_02") {
                    var messageFeed = mckMessageLayout.getMessageFeed(message);
                    events.onMessageSent({
                        'message': messageFeed
                    });
                }
                if (message.conversationId) {
                    var conversationPxy = MCK_CONVERSATION_MAP[message.conversationId];
                    if ((IS_MCK_TOPIC_HEADER || IS_MCK_TOPIC_BOX) && ((typeof conversationPxy !== 'object') || (typeof(MCK_TOPIC_DETAIL_MAP[conversationPxy.topicId]) !== 'object'))) {
                        mckMessageService.getTopicId({
                            'conversationId': message.conversationId,
                            'messageType': messageType,
                            'message': message,
                            'notifyUser': resp.notifyUser,
                            'async': false,
                            'populate': false
                        });
                    }
                }

                if (typeof contact === 'undefined') {
                    var params = {
                        'message': message,
                        'messageType': messageType,
                        'notifyUser': resp.notifyUser
                    };
                    if (message.groupId) {
                        mckGroupLayout.getGroupFeedFromMessage(params);
                    } else {
                        var userIdArray = [];
                        userIdArray.push(message.to);
                        mckContactService.getUsersDetail(userIdArray, params);
                    }
                    return;
                }

                mckMessageLayout.populateMessage(messageType, message, resp.notifyUser);
            }
        }
    };
    _this.onMessage = function(obj) {
        if (subscriber != null && subscriber.id === obj.headers.subscription) {
            var resp = $applozic.parseJSON(obj.body);
            var messageType = resp.type;
            if (messageType === "APPLOZIC_04" || messageType === "MESSAGE_DELIVERED") {
                $applozic("." + resp.message.split(",")[0] + " .mck-message-status").removeClass('mck-icon-time').removeClass('mck-icon-sent').addClass('mck-icon-delivered');
                mckMessageLayout.addTooltip(resp.message.split(",")[0]);
                events.onMessageDelivered({
                    'messageKey': resp.message.split(",")[0]
                });
            } else if (messageType === 'APPLOZIC_08' || messageType === "MT_MESSAGE_DELIVERED_READ") {
                $applozic("." + resp.message.split(",")[0] + " .mck-message-status").removeClass('mck-icon-time').removeClass('mck-icon-sent').removeClass('mck-icon-delivered').addClass('mck-icon-read');
                mckMessageLayout.addTooltip(resp.message.split(",")[0]);
                events.onMessageRead({
                    'messageKey': resp.message.split(",")[0]
                });
            } else if (messageType === "APPLOZIC_05") {
                var key = resp.message.split(",")[0];
                var tabId = resp.message.split(",")[1];
                var isGroup = (resp.message.split(",")[2] === "1") ? true : false;
                mckMessageLayout.removedDeletedMessage(key, tabId, isGroup);
                var eventResponse = {
                    'messageKey': resp.message.split(",")[0]
                };
                (isGroup) ? eventResponse['groupId'] = tabId: eventResponse['userKey'] = tabId;
                console.log(eventResponse);
                events.onMessageDeleted(eventResponse);
            } else if (messageType === 'APPLOZIC_27') {
                var userId = resp.message.split(",")[0];
                var topicId = resp.message.split(",")[1];
                if (typeof userId !== 'undefined') {
                    mckMessageLayout.removeConversationThread(userId, false);
                    mckMessageLayout.updateUnreadCount('user_' + userId, 0, true);
                    var response = {
                        'userId': userId
                    };
                    if (topicId) {
                        response['topicId'] = topicId;
                    }
                    events.onConversationDeleted(response);
                }
            } else if (messageType === 'APPLOZIC_11') {
                var userId = resp.message;
                var contact = mckMessageLayout.fetchContact(userId);
                var tabId = $mck_message_inner.data('mck-id');
                if (!MCK_BLOCKED_TO_MAP[userId] && !MCK_BLOCKED_BY_MAP[userId]) {
                    if (tabId === contact.contactId && !$mck_message_inner.data('isgroup')) {
                        $applozic('#mck-tab-status').html(MCK_LABELS['online']);
                        if (IS_OFFLINE_MESSAGE_ENABLED) {
                            mckMessageLayout.hideOfflineMessage();
                        }
                    } else {
                        var htmlId = mckContactUtils.formatContactId(userId);
                        $applozic("#li-user-" + htmlId + " .mck-ol-status").removeClass('n-vis').addClass('vis');
                    }
                    $applozic('.mck-user-ol-status.' + htmlId).removeClass('n-vis').addClass('vis');
                    $applozic('.mck-user-ol-status.' + htmlId).next().html('(' + MCK_LABELS['online'] + ')');
                    w.MCK_OL_MAP[userId] = true;
                    mckUserUtils.updateUserStatus({
                        'userId': resp.message,
                        'status': 1
                    });
                }
                events.onUserConnect({
                    'userId': resp.message
                });
            } else if (messageType === 'APPLOZIC_12') {
                var userId = resp.message.split(",")[0];
                var lastSeenAtTime = resp.message.split(",")[1];
                var contact = mckMessageLayout.fetchContact(userId);
                w.MCK_OL_MAP[userId] = false;
                if (lastSeenAtTime) {
                    MCK_LAST_SEEN_AT_MAP[userId] = lastSeenAtTime;
                }
                if (!MCK_BLOCKED_TO_MAP[userId] && !MCK_BLOCKED_BY_MAP[userId]) {
                    var tabId = $mck_message_inner.data('mck-id');
                    if (tabId === contact.contactId && !$mck_message_inner.data('isgroup')) {
                        document.getElementById("mck-tab-status").innerHTML = mckDateUtils.getLastSeenAtStatus(lastSeenAtTime);
                        if (IS_OFFLINE_MESSAGE_ENABLED) {
                            mckInit.manageOfflineMessageTime(tabId);
                        }
                    }
                    document.querySelector(".mck-user-ol-status." + contact.htmlId).classList.remove('vis').add('n-vis');
                    document.querySelector(".mck-user-ol-status." + contact.htmlId).nextElementSibling.innerHTML = '(Offline)';
                    document.querySelector("#li-user-" + htmlId + " .mck-ol-status").classList.remove('vis').add('n-vis');
                    mckUserUtils.updateUserStatus({
                        'userId': userId,
                        'status': 0,
                        'lastSeenAtTime': lastSeenAtTime
                    });
                }
                events.onUserDisconnect({
                    'userId': userId,
                    'lastSeenAtTime': lastSeenAtTime
                });
            } else if (messageType === "APPLOZIC_29") {
                var userId = resp.message.split(",")[0];
                var topicId = resp.message.split(",")[1];
                var contact = mckMessageLayout.fetchContact(userId);
                mckMessageLayout.updateUnreadCount('user_' + contact.contactId, 0, true);
                var tabId = $mck_message_inner.data('mck-id');
                if ((typeof tabId === "undefined") || tabId === '') {
                    document.querySelector("#li-user-" + contact.htmlId + " .mck-unread-count-text").innerHTML = mckMessageLayout.getUnreadCount('user_' + contact.contactId);
                    document.querySelector("#li-user-" + contact.htmlId + " .mck-unread-count-box").classList.remove('vis').add('n-vis');
                }
                var response = {
                    'userId': userId
                };
                if (topicId) {
                    response['topicId'] = topicId;
                }
                events.onConversationReadFromOtherSource(response);
            } else if (messageType === 'APPLOZIC_28') {
                var userId = resp.message.split(",")[0];
                var topicId = resp.message.split(",")[1];
                var tabId = $mck_message_inner.data('mck-id');
                if (tabId === userId) {
                    document.querySelector(".mck-msg-right .mck-message-status").classList.remove('mck-icon-time').remove('mck-icon-sent').remove('mck-icon-delivered').add('mck-icon-read');
                    document.querySelector(".mck-msg-right .mck-icon-delivered").attr('title', 'delivered and read');
                    var contact = mckMessageLayout.getContact(userId);
                    if (typeof contact === 'undefined') {
                        var userIdArray = [];
                        userIdArray.push(userId);
                        mckContactService.getUsersDetail(userIdArray, {});
                    }
                }
                var response = {
                    'userId': userId
                };
                if (topicId) {
                    response['topicId'] = topicId;
                }
                events.onConversationRead(response);
            } else if (messageType === "APPLOZIC_16") {
                var status = resp.message.split(":")[0];
                var userId = resp.message.split(":")[1];
                var contact = mckMessageLayout.fetchContact(userId);
                var tabId = $mck_message_inner.data('mck-id');
                if (tabId === contact.contactId) {
                    if (status === BLOCK_STATUS_MAP[0]) {
                        MCK_BLOCKED_TO_MAP[contact.contactId] = true;
                        mckUserUtils.toggleBlockUser(tabId, true);
                    } else {
                        MCK_BLOCKED_BY_MAP[contact.contactId] = true;
                        mck_tab_title.classList.remove('mck-tab-title-w-status');
                        mck_tab_status.classList.remove('vis').add('n-vis');
                        mck_typing_box.classList.remove('vis').add('n-vis');
                    }
                } else {
                    document.querySelector("#li-user-" + contact.htmlId + " .mck-ol-status").classList.remove('vis').add('n-vis');
                }
                events.onUserBlocked({
                    'status': status,
                    'userId': userId
                });
            } else if (messageType === 'APPLOZIC_17') {
                var status = resp.message.split(":")[0];
                var userId = resp.message.split(":")[1];
                var contact = mckMessageLayout.fetchContact(userId);
                var tabId = $mck_message_inner.data('mck-id');
                if (tabId === contact.contactId) {
                    if (status === BLOCK_STATUS_MAP[2]) {
                        MCK_BLOCKED_TO_MAP[contact.contactId] = false;
                        mckUserUtils.toggleBlockUser(tabId, false);
                    } else if (w.MCK_OL_MAP[tabId] || MCK_LAST_SEEN_AT_MAP[tabId]) {
                        MCK_BLOCKED_BY_MAP[contact.contactId] = false;
                        if (!MCK_BLOCKED_TO_MAP[tabId]) {
                            if (w.MCK_OL_MAP[tabId]) {
                                mck_tab_status.innerHTML = MCK_LABELS['online'];
                            } else if (MCK_LAST_SEEN_AT_MAP[tabId]) {
                                mck_tab_status.innerHTML = mckDateUtils.getLastSeenAtStatus(MCK_LAST_SEEN_AT_MAP[tabId]);
                            }
                            mck_tab_title.classList.add('mck-tab-title-w-status');
                            $mck_tab_status.classList.remove('n-vis').add('vis');
                        }
                    }
                } else if (w.MCK_OL_MAP[tabId]) {
                    document.querySelector('#li-user-' + contact.htmlId + ' .mck-ol-status').classList.remove('n-vis').add('vis');
                }
                events.onUserUnblocked({
                    'status': status,
                    'userId': userId
                });
            } else if (messageType === 'APPLOZIC_18') {
                IS_MCK_USER_DEACTIVATED = false;
                events.onUserActivated();
            } else if (messageType === 'APPLOZIC_19') {
                IS_MCK_USER_DEACTIVATED = true;
                events.onUserDeactivated();
            } else {
                var message = resp.message;
                // var userIdArray =
                // mckMessageLayout.getUserIdFromMessage(message);
                // mckContactService.getContactDisplayName(userIdArray);
                // mckMessageLayout.openConversation();
                if (messageType === "APPLOZIC_03") {
                    ALStorage.updateLatestMessage(message);
                    if (message.type !== 0 && message.type !== 4) {
                        document.querySelector("." + message.key + " .mck-message-status").classList.remove('mck-icon-time').add('mck-icon-sent');
                        mckMessageLayout.addTooltip(message.key);
                    }
                    events.onMessageSentUpdate({
                        'messageKey': message.key
                    });
                } else if (messageType === "APPLOZIC_01" || messageType === "APPLOZIC_02" || messageType === "MESSAGE_RECEIVED") {
                    ALStorage.updateLatestMessage(message);
                    var contact = (message.groupId) ? mckGroupUtils.getGroup(message.groupId) : mckMessageLayout.getContact(message.to);
                    var mck_sidebox_content = document.getElementById("mck-sidebox-content");
                    var tabId = $mck_message_inner.data('mck-id');
                    if (messageType === "APPLOZIC_01" || messageType === "MESSAGE_RECEIVED") {
                        var messageFeed = mckMessageLayout.getMessageFeed(message);
                        events.onMessageReceived({
                            'message': messageFeed
                        });
                    } else if (messageType === "APPLOZIC_02") {
                        var messageFeed = mckMessageLayout.getMessageFeed(message);
                        events.onMessageSent({
                            'message': messageFeed
                        });
                    }
                    if (message.conversationId) {
                        var conversationPxy = MCK_CONVERSATION_MAP[message.conversationId];
                        if ((IS_MCK_TOPIC_HEADER || IS_MCK_TOPIC_BOX) && ((typeof conversationPxy !== 'object') || (typeof(MCK_TOPIC_DETAIL_MAP[conversationPxy.topicId]) !== 'object'))) {
                            mckMessageService.getTopicId({
                                'conversationId': message.conversationId,
                                'messageType': messageType,
                                'message': message,
                                'notifyUser': resp.notifyUser,
                                'async': false,
                                'populate': false
                            });
                        }
                    }
                    if (typeof contact === 'undefined') {
                        var params = {
                            'message': message,
                            'messageType': messageType,
                            'notifyUser': resp.notifyUser
                        };

                        if (message.groupId) {
                            mckGroupLayout.getGroupFeedFromMessage(params);
                        } else {
                            var userIdArray = [];
                            userIdArray.push(message.to);
                            mckContactService.getUsersDetail(userIdArray, params);
                        }
                        return;
                    }
                    if (message.contentType == 102 && IS_CALL_ENABLED) {
                        //video message Received...
                        //dont show notification for 102 messages
                        resp.notifyUser = false;
                        if (message.type == 4 && message.metadata.MSG_TYPE == "CALL_DIALED") {
                            //its a call dialed Message.. Show Receive/Reject option on screen
                            var contact = mckMessageLayout.fetchContact(message.to);
                            var displayName = mckMessageLayout.getTabDisplayName(contact.contactId, false);

                            var imgSource = mckMessageLayout.getContactImageLink(contact, displayName);
                            $applozic("#mck-video-call-indicator").data("call-id", message.metadata.CALL_ID);
                            $applozic("#mck-video-call-indicator").data("isAudioCall", message.metadata.CALL_AUDIO_ONLY);
                            $applozic("#mck-video-call-indicator-txt").html(displayName + " calling...");
                            $applozic("#mck-video-call-icon").html(imgSource);
                            $applozic("#mck-video-call-indicator").removeClass("n-vis").addClass("vis");
                            mckVideoCallringTone.play();
                            //timer if user not receive call in 1 minute....
                            setTimeout(function() {
                                var callReceived = $applozic("#mck-video-call-indicator").data("callReceived");
                                if (!callReceived) {
                                    console.log("call is not answered");
                                    //no need to notify server... sender is doing this...thank you sender.
                                    //mckMessageService.sendVideoCallMessage(callId,"CALL_MISSED",102,false);
                                    mckVideoCallringTone.stop();
                                    document.querySelector("#mck-video-call-indicator").classList.add("n-vis").remove("vis");

                                }
                            }, 60000);
                        } else if (message.type == 4 && message.metadata.MSG_TYPE == "CALL_REJECTED") {
                            //notify server.. content type 103 msgType CALL_REJECTED
                            //check is this device is call host
                            if ($applozic("#mck-btn-video-call").data("isCallHost")) {
                                mckMessageService.sendVideoCallMessage(message.metadata.CALL_ID, "CALL_REJECTED", 103, false);
                                mckCallService.ringToneForHost.stop();
                                mckCallService.outgoingCallServices.twilioService.leaveRoomIfJoined();
                                mckCallService.hideVideoBox();
                                if (mckCallService.outgoingCallServices) {
                                    mckCallService.outgoingCallServices.rejectedByReceiver = true;
                                }
                            }
                        }
                    }

                    if (message.contentType == 103) {
                        if (message.type == 4 && message.metadata.MSG_TYPE == "CALL_MISSED") {
                            //stop ringtone and hide vid-call-indicator
                             document.querySelector("#mck-video-call-indicator").classList.add("n-vis").remove("vis");
                            if (mckVideoCallringTone) {
                                mckVideoCallringTone.stop();
                            }
                            }
                        // no nedd to handle  message.type==4 and metadata.MSG_TYPE=="CALL_Rejected AND contnetType 103"
                    } else {
                        mckMessageLayout.populateMessage(messageType, message, resp.notifyUser);
                    }
                }
            }
        }
    };
}

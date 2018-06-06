<template>
    <v-container fill-height class="chat-container">
        <v-layout height="100%" width="100%" class="card" style="padding: 10px;">
            <v-flex xs4 class="side-panel">
                <div>
                    <v-text-field hide-details v-model="searchInput" label="Search contact" append-icon="search" />
                </div>
                <div>
                    <ul>
                        <li v-for="(contact, contactName) in contacts"
                            :class="{ active: activeContact.name === contactName, contact: true }"
                            @click="activeContactIndex = getIndexOfContact(contactName)">
                            <v-layout>
                                <div class="contact-avatar">
                                    <app-avatar :name="contactName" :size="35" />
                                </div>
                                <v-flex>
                                    {{ contactName }}<br />
                                    {{ contact.conversations[contact.conversations.length - 1].content }}
                                </v-flex>
                            </v-layout>
                        </li>
                    </ul>
                </div>
            </v-flex>
            <v-flex xs12>
                <v-layout column>
                    <v-flex>
                        <v-layout class="current-contact">
                            <div class="current-contact-avatar">
                                <app-avatar :name="activeContact.name" />
                            </div>
                            <v-flex>
                                {{ activeContact.name }}<br />
                                {{ activeContact.active ? 'Active' : 'Not Active' }}
                            </v-flex>
                        </v-layout>
                    </v-flex>
                    <v-flex sm12 style="position: relative;">
                        <div class="messages-outer-container" ref="messagesScroller">
                            <ul class="messages-inner-container">
                                <li v-for="msg in activeContact.conversations" :class="{ incoming: msg.incoming, 'message-container': true }">
                                    <div class="message-author">
                                        <app-avatar :name="msg.author" />
                                    </div>
                                    <div class="message-data-content">
                                        <v-tooltip top>
                                            <span slot="activator" class="message-date">{{ dateIntervalFormat(msg.date) }}</span>
                                            <span>{{ msg.date.toLocaleString() }}</span>
                                        </v-tooltip><br />
                                        <v-card class="message-content" v-html="nl2br(msg.content)" />
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </v-flex>
                    <v-flex>
                        <v-text-field hide-details multi-line auto-grow :rows="1" label="Write a message..." append-icon="send" :append-icon-cb="sendMessage" autofocus v-model="message" @keyup.native.enter.exact="sendMessage" />
                    </v-flex>
                </v-layout>
            </v-flex>
        </v-layout>
    </v-container>
</template>

<script>
  import AppAvatar from "./sub-components/AppAvatar";

  export default {
    name: "AppChat",
    components: { AppAvatar },
    data() {
      return {
        mutationObserver: new MutationObserver(() => this.$refs.messagesScroller.scrollTop = this.$refs.messagesScroller.scrollHeight),
        searchInput: '',
        activeContactIndex: 0,
        allContacts: {
          'Alon Talmor': {
            active: true,
            conversations: [
              {
                incoming: true,
                author: 'Alon Talmor',
                content: 'Hi Idan',
                date: new Date(2018, 5, 3, 21, 23)
              },
              {
                incoming: false,
                author: 'Idan Yadgar',
                content: 'Hi Alon,\nHow are you today?',
                date: new Date(2018, 5, 3, 21, 47)
              }
            ]
          },
          'Or Abramovich': {
            active: false,
            conversations: [
              {
                incoming: false,
                author: 'Idan Yadgar',
                content: 'Hi Or, I would like to talk about the project tomorrow',
                date: new Date(2018, 5, 3, 21, 25)
              },
              {
                incoming: true,
                author: 'Or Abramovich',
                content: 'No problem, we\'ll meet at the office',
                date: new Date(2018, 5, 3, 21, 41)
              }
            ]
          }
        },
        message: ''
      };
    },
    computed: {
      activeContact() {
        let name = Object.keys(this.allContacts)[this.activeContactIndex];

        return {
          name,
          active: this.allContacts[name].active,
          conversations: this.allContacts[name].conversations
        }
      },
      contacts() {
        let searchInput = this.searchInput.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

        let contacts = {};
        for (let contactName in this.allContacts) {
          if (this.allContacts.hasOwnProperty(contactName) && new RegExp(searchInput, 'i').test(contactName)) {
            contacts[contactName] = this.allContacts[contactName];
          }
        }

        return contacts;
      }
    },
    mounted() {
        this.mutationObserver.observe(this.$refs.messagesScroller.children[0], { childList: true });
    },
    beforeDestroy() {
      this.mutationObserver.disconnect();
    },
    methods: {
      sendMessage() {
        this.message = this.message.trim();

        if (this.message === '') {
          return;
        }

        this.activeContact.conversations.push({
          incoming: false,
          author: 'Idan Yadgar',
          content: this.message,
          date: new Date()
        });

        this.message = '';
      },
      getIndexOfContact(contactName) {
        return Object.keys(this.allContacts).indexOf(contactName);
      },
      nl2br(str) {
        return str.replace(/(?:\r\n|\r|\n)/g, '<br />');
      },
      dateIntervalFormat(date) {
        const time = (Date.now() - date) / 1000;
        if (time < 60) {
          return 'Just now';
        } else if (time >= 60 && time < 3600) {
          return `${Math.floor(time / 60)} minutes ago`;
        } else if (time >= 3600 && time < 86400) {
          return `${Math.floor(time / 3600)} hours ago`;
        }
        return `${Math.floor(time / 86400)} days ago`;
      }
    }
  }
</script>

<style scoped>
    ul, li {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .contact {
        cursor: pointer;
        padding: 10px;
    }

    .contact:hover {
        background-color: #aaa;
    }

    .contact.active {
        background-color: gray;
    }

    .contact-avatar, .contact-avatar ~ * {
        vertical-align: middle;
    }

    .contact-avatar {
        margin-right: 10px;
    }

    .contact-avatar:before {
        content: '';
        display: inline-block;
        height: 100%;
        vertical-align: middle;
    }

    .contact-avatar > * {
        vertical-align: middle;
        display: inline-block;
    }

    .current-contact > * {
        vertical-align: middle;
    }

    .current-contact-avatar {
        margin: 0 10px;
    }

    .messages-outer-container {
        height: 100%;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        overflow-y: scroll;
    }

    .messages-outer-container:before {
        content: '';
        display: inline-block;
        height: 100%;
        vertical-align: top;
    }

    .messages-inner-container {
        display: inline-block;
        vertical-align: bottom;
        width: 100%;
        padding: 15px;
    }

    .message-container {
        margin-top: 30px;
    }

    .message-container.incoming {
        direction: rtl;
        text-align: right;
    }

    .message-container.incoming > * {
        direction: ltr;
        text-align: left;
    }

    .message-container > div {
        vertical-align: middle;
        display: inline-block;
    }

    .message-data-content {
        margin-left: 15px;
        margin-top: -24px;
        text-align: right;
    }

    .message-date {
        display: inline-block;
        padding-top: 5px;
        font-size: 12px;
    }

    .message-content {
        display: inline-block;
        width: 100%;
        padding: 15px;
        text-align: left;
    }

    .message-container:not(.incoming) .message-content {
        background-color: #64b5e0;
    }
</style>
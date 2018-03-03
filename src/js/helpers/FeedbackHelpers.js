import os from 'os';
import appPackage from '../../../package';
import axios from 'axios';

/**
 * Submits a new support ticket.
 * If the response is 401 the user is not registered and you should supply
 * a `name` in order to create the account.
 *
 * @param {string} category - the support category
 * @param {string} message - the user's feedback
 * @param {string} [name] - the user's name. Only use this if you need to create a new support account.
 * @param {string} email - the email opening this ticket
 * @param {object} [state] - the application state. If this is set both the state and system information will be submitted.
 * @return {AxiosPromise}
 */
export const submitFeedback = ({category, message, name, email, state}) => {
  const osInfo = {
    arch: os.arch(),
    cpus: os.cpus(),
    memory: os.totalmem(),
    type: os.type(),
    networkInterfaces: os.networkInterfaces(),
    loadavg: os.loadavg(),
    eol: os.EOL,
    userInfo: os.userInfo(),
    homedir: os.homedir(),
    platform: os.platform(),
    release: os.release()
  };

  let fullMessage = `${message}\n\nApp Version:\n${appPackage.version}`;
  if(state) {
    fullMessage += `\n\nSystem Information:\n${JSON.stringify(osInfo)}\n\nApp State:\n${JSON.stringify(state)}`;
  }

  const request = {
    method: 'POST',
    url: 'http://help.door43.org/api/v1/tickets',
    params: {
      token: process.env.TC_HELP_DESK_TOKEN
    },
    data: {
      name: `tC ${category}`,
      body: fullMessage,
      tag_list: `${category}, translationCore`,
      user_email: email,
      channel: 'translationCore'
    }
  };

  if(name) {
    request.data.user_name = name;
  }

  return axios(request);
};

/**
 * Checks if the feedback response indicates the user is not registered.
 * @param {object} response - the error.response given by axios
 * @return {bool}
 */
export const isNotRegistered = (response) => {
  const {data} = response;
  const expectedResponse = 'user not registered';
  const notRegistered = Boolean(data) && Boolean(data.error) && data.error.toLowerCase().includes(expectedResponse);
  return response.status === 401 && notRegistered;
};

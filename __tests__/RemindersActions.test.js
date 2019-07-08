import consts from '../src/js/actions/ActionTypes';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as actions from '../src/js/actions/RemindersActions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
import { TRANSLATION_WORDS } from '../src/js/common/constants';

jest.mock('../src/js/helpers/gatewayLanguageHelpers', () => ({
  getGatewayLanguageCodeAndQuote: () => {
    return {
      gatewayLanguageCode: 'en',
      gatewayLanguageQuote: 'authority'
    };
  }
}));

describe('RemindersActions.toggleReminder', () => {
  test('Toggle reminder', () => {
    const expectedActions = [{
      type: consts.TOGGLE_REMINDER,
      modifiedTimestamp: "2017-10-27T18:13:41.455Z",
      userName: 'mannycolon',
      gatewayLanguageCode: 'en',
      gatewayLanguageQuote: 'authority'
    }];
    const store = mockStore({
      projectDetailsReducer: {
        currentProjectToolsSelectedGL: {
          translationWords: 'en'
        }
      },
      toolsReducer: {
        selectedTool: TRANSLATION_WORDS
      },
      groupsIndexReducer: {
        groupsIndex: [
          {
            id: 'apostle',
            name: 'apostle, apostles, apostleship'
          },
          {
            id: 'authority',
            name: 'authority, authorities'
          }
        ]
      },
      contextIdReducer: {
        contextId: {
          groupId: 'authority'
        }
      }
    });
    store.dispatch(actions.toggle('mannycolon', "2017-10-27T18:13:41.455Z"));

    expect(store.getActions()).toEqual(expectedActions);
  });
});

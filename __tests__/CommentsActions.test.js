import consts from '../src/js/actions/ActionTypes';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('CommentsActions.addComment', () => {
  test('Add Comment', () => {
      const expectedAction = {
        type: consts.ADD_COMMENT,
        modifiedTimestamp: "2017-10-27T18:13:41.455Z",
        text: 'comment',
        userName: 'mannycolon'
      };
      const store = mockStore({
        text: null,
        userName: null,
        modifiedTimestamp: null
      });
      
      expect(store.dispatch({
        type: consts.ADD_COMMENT,
        modifiedTimestamp: "2017-10-27T18:13:41.455Z",
        text: 'comment',
        userName: 'mannycolon'
      })).toEqual(expectedAction);
  });
});

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Col } from 'react-bootstrap';
import RootStyles from '../pages/RootStyle';
// containers
import SideBarContainer from './SideBarContainer';
import ModuleWrapperContainer from './ModuleWrapperContainer';
// components
// import component from 'componentPath'
// actions
// import {actionCreator} from 'actionCreatorPath'


class BodyContainer extends Component {
  render() {
    return (
      <div>
         <Col className="col-fluid" xs={1} sm={2} md={2} lg={3} style={{ padding: 0, width: "250px" }}>
            <SideBarContainer />
          </Col>
          <Col style={RootStyles.ScrollableSection} xs={7} sm={8} md={9} lg={9.5}>
            <ModuleWrapperContainer />
          </Col>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    prop: state.prop
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    dispatch1: () => {
      dispatch(actionCreator)
    }
  }
}



export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BodyContainer)

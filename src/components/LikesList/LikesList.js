import React from 'react';
import {debounce} from 'lodash';
import {connect} from 'react-redux';
import {closeModal} from "../../actions/modal";
import UsersList from "../UsersList/UsersList";
import {getVoters} from "../../actions/posts";
import CloseButton from "../Common/CloseButton/CloseButton";

class LikesModal extends React.Component {
  constructor(props) {
    super(props);
  }

  get permLink() {
    let urlObject = this.props.url.split('/');
    return `${urlObject[urlObject.length - 2]}/${urlObject[urlObject.length - 1]}`;
  }

  render() {
    return (
      <div className="container_lik-lis">
        <div className="header_lik-lis">
          <div className='title_lik-lis'>Post has been rated by these users</div>
          <CloseButton className='close-button_lik-lis'/>
        </div>
        <UsersList
          point={`post/${this.permLink}/voters`}
          getUsers={getVoters}
          className="body_lik-lis"
        />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    url: state.posts[props.postIndex].url,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    closeModal: () => {
      dispatch(closeModal('LikesModal'));
    }
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(LikesModal);
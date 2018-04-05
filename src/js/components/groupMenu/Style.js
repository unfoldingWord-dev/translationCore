var style = {
  menuItem: {
    heading: {
      normal: {
        display: "block",
        paddingTop: "7px",
        paddingRight: '5px',
        paddingBottom: "10px",
        paddingLeft: '15px',
        cursor: "pointer",
        borderBottom: "1px solid var(--background-color)",
        fontWeight: 'normal',
        color: 'var(--reverse-color)'
      },
      current: {
        display: "block",
        paddingTop: "7px",
        paddingRight: '5px',
        paddingBottom: "10px",
        paddingLeft: '15px',
        cursor: "pointer",
        borderBottom: "1px solid var(--background-color)",
        backgroundColor: "var(--accent-color)",
        fontWeight: 'bold',
        color: 'var(--reverse-color)'
      }
    },
    statusIcon: {
      ok: {
        color: 'var(--completed-color)',
        display: 'initial'
      },
      comment: {
        color: 'var(--highlight-color)',
        display: 'initial'
      },
      pencil: {
        color: 'var(--reverse-color)',
        display: 'initial'
      },
      flagged: {
        color: 'var(--highlight-color)',
        display: 'initial'
      },
      unchecked: {
        display: 'none'
      },
      bookmark: {
        color: 'var(--reverse-color)',
        display: 'initial'
      },
      invalidated: {
        display: 'initial',
        height: '16px',
        width: '16px'
      },
      blank: {
        display: 'initial',
        color: 'none',
        paddingLeft: '15px'
      }
    }
  },

  subMenuItem: {
    height: 38,
    alignItems: 'center',
    display: "flex",
    padding: "10px 0",
    cursor: "pointer",
    borderBottom: "1px solid var(--background-color-dark)",
    color: "var(--reverse-color)",
    backgroundColor: "var(--background-color)"
  },

  activeSubMenuItem: {
    height: 38,
    alignItems: 'center',
    display: "flex",
    padding: "10px 0",
    cursor: "pointer",
    borderBottom: "1px solid var(--background-color-dark)",
    color: "var(--reverse-color)",
    backgroundColor: "var(--accent-color)",
    zIndex: 1
  },

  groupItemText: {
    textOverflow: 'ellipsis',
    padding: '0px 20px 0px 0px',
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  },
  slideButton: {
    float: "right",
    marginTop: "50vh",
    zIndex: "999",
    color: "var(--reverse-color)",
    backgroundColor: "var(--text-color-dark)",
    padding: "10px 0",
    marginRight: "-15px",
    borderRadius: "0 5px 5px 0"
  },

  slideButtonCollapsed: {
    float: "left",
    marginTop: "50vh",
    zIndex: "999",
    color: "var(--reverse-color)",
    backgroundColor: "var(--text-color-dark)",
    padding: "10px 0",
    marginRight: "-15px",
    borderRadius: "0 5px 5px 0"
  }

};

module.exports = style;

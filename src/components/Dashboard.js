import React, { Component } from 'react';
import Loading from './Loading';
import Panel from './Panel';
import classnames from 'classnames';
import axios from 'axios';
import { setInterview } from 'helpers/reducers';
import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay,
} from 'helpers/selectors';

const data = [
  {
    id: 1,
    label: 'Total Interviews',
    value: getTotalInterviews,
  },
  {
    id: 2,
    label: 'Least Popular Time Slot',
    value: getLeastPopularTimeSlot,
  },
  {
    id: 3,
    label: 'Most Popular Day',
    value: getMostPopularDay,
  },
  {
    id: 4,
    label: 'Interviews Per Day',
    value: getInterviewsPerDay,
  },
];

class Dashboard extends Component {
  state = {
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {},
  };

  componentDidMount() {
    Promise.all([
      axios.get('api/days'),
      axios.get('api/appointments'),
      axios.get('api/interviewers'),
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data,
        loading: false,
      });
    });
    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (typeof data === 'object' && data.type === 'SET_INTERVIEW') {
        this.setState((previousState) =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };
    const focused = JSON.parse(localStorage.getItem('focused'));

    if (focused) {
      this.setState({ focused });
    }
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem('focused', JSON.stringify(this.state.focused));
    }
  }
  componentWillUnmount() {
    this.socket.close();
  }
  selectPanel = (id) => {
    this.state.focused
      ? this.setState({ focused: null })
      : this.setState({ focused: id });
  };

  render() {
    const dashboardClasses = classnames('dashboard', {
      'dashboard--focused': this.state.focused,
    });
    if (this.state.loading) {
      return <Loading />;
    }

    const panels = data
      .filter(
        (panel) =>
          this.state.focused === null || this.state.focused === panel.id
      )
      .map((panel) => (
        <Panel
          key={panel.id}
          id={panel.id}
          label={panel.label}
          value={panel.value(this.state)}
          onSelect={(e) => this.selectPanel(panel.id)}
        />
      ));

    return <main className={dashboardClasses}>{panels}</main>;
  }
}

export default Dashboard;

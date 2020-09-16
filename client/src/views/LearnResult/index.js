import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import Header from "../../components/Result/Header";
import {
  deleteID,
  deleteModel,
  deleteTeacher,
  getID,
  getModel,
  getTeacher,
} from "../../utils/session_storage";
import { message, Row, Col } from "antd";
import "./../../styles/result.scss";
import { Processing, Result, Delete } from "../../api";
import LearnProcess from "../../components/Result/LearnProcess";
import ModelGraph from "../../components/Result/ModelGraph";
import LearnedResult from "../../components/Result/LearnedResult";
import LearnFail from "../../components/Result/LearnFail";

let timer;

class LearnResult extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: getID(),
      model: getModel(),
      middleModels: [],
      ifOmit: false,
      learnedModel: null,
      result: null,
      learnFlag: true,
      isFinished: false,
      lastModified: 0,
      teacherType: getTeacher(),
    };
  }

  componentDidMount() {
    if (!this.state.id) {
      message.warning("请先上传模型并配置参数！");
      this.backToHome();
      return false;
    }
    this.getProcessing(this.state.id);
  }

  componentWillUnmount() {
    clearInterval(timer);
  }

  backToHome = () => {
    deleteID();
    deleteModel();
    deleteTeacher();
    if (this.state.id) {
      // 删除后台的存储
      Delete({ id: this.state.id }).then(() => {});
    }
    this.props.history.push("/");
  };

  // 开始轮询
  getProcessing = (id) => {
    timer = setInterval(() => {
      Processing({ id, lastModified: this.state.lastModified })
        .then((response) => {
          const data = response.data;
          if (data.code === 0) {
            // 更新学习过程
            if (this.state.teacherType === "smartTeacher") {
              this.setState({
                middleModels: data.middleModels,
                ifOmit: data.ifOmit,
                lastModified: data.lastModified,
              });
            } else {
              this.setState({
                lastModified: data.lastModified,
              });
            }
          } else if (data.code === 1) {
            // 学习结束
            if (this.state.teacherType === "smartTeacher") {
              this.setState({
                middleModels: data.middleModels,
                ifOmit: data.ifOmit,
                lastModified: data.lastModified,
                isFinished: true
              });
            } else {
              this.setState({
                lastModified: data.lastModified,
                isFinished: true
              });
            }
            clearInterval(timer);
            this.getResult(id);
          } else if (data.code === 2) {
            // 没有更新
          }
        })
        .catch((error) => {
          clearInterval(timer);
          console.log(error);
        });
    }, 3000);
  };

  // 获取结果
  getResult = (id) => {
    Result({ id })
      .then((response) => {
        const data = response.data;
        if (data.code === 0) {
          message.success("学习成功！");
          this.setState({
            learnedModel: data.learnedModel,
            result: data.result,
            learnFlag: true,
          });
        } else {
          message.warning("学习失败或超时！");
          this.setState({
            learnFlag: false,
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  render() {
    return (
      <div className="result">
        <Header
          title="Learning Result"
          type="result"
          backToHome={this.backToHome}
        />
        <Row className="learn-result__wrap">
          <Col span={24}>
            { (this.state.learnFlag || this.state.teacherType === "normalTeacher") ? (
              <LearnProcess
                middleModels={this.state.middleModels}
                ifOmit={this.state.ifOmit}
                teacherType={this.state.teacherType}
                isFinished={this.state.isFinished}
              />
            ) : (
              <LearnFail title="学习过程" />
            )}
          </Col>
          <Col span={12}>
            <ModelGraph
              title={"原始模型"}
              model={this.state.model}
              isFull={true}
            />
          </Col>
          <Col span={12}>
            {this.state.learnFlag ? (
              <ModelGraph
                title={"结果模型"}
                model={this.state.learnedModel}
                isFull={true}
              />
            ) : (
              <LearnFail title="结果模型" />
            )}
          </Col>
          <Col span={24}>
            {this.state.learnFlag ? (
              <LearnedResult result={this.state.result} isFinished={this.state.isFinished}/>
            ) : (
              <LearnFail title="学习结果" />
            )}
          </Col>
        </Row>
      </div>
    );
  }
}

export default withRouter(LearnResult);

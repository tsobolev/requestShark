const databaseName = 'requestAnalyzerDatabase'
const storageName = 'requestDefaultStorage'
const storageLogs = 'requestLogsStorage'
const storageConf = 'confStorage'
const dbVersion = 23
const interfacePath = '/interface/'
const defaultConfig = `{
  "variables": {
    "testvar": 1
  },
  "actions": [
    {
      "name": "typeFake",
      "event": "typeFake Test string"
    },
    {
      "name": "typeReal",
      "event": "typeReal Test string"
    }
  ],
  "requests": [
    {
      "regex": "^http.?://httpbin.org/post$",
      "handler": [
        {
          "fn": "save",
          "args": {
            "filter": ".",
            "condition": "true"
          }
        },
        {
          "fn": "set",
          "args": {
            "filter": "{ 'testvar': (.state.testvar + 1) }",
            "condition": "true"
          }
        }
      ],
      "enable": true
    }
  ],
  "fsm": {
    "init": "S0",
    "state": "S0",
    "transitions": {
      "typeFake Test string": {
        "S0": {
          "to": "S1",
          "handler": {
            "fn": "typeFake",
            "args": {
              "left": "5%",
              "top": "254px",
              "str": "fake test string",
              "delay": 500
            },
            "results": {
              "success": "clearFake"
            }
          }
        }
      },
      "clearFake": {
        "S1": {
          "to": "S2",
          "handler": {
            "fn": "clearFake",
            "args": {
              "left": "5%",
              "top": "254px",
              "delay": 500
            },
            "results": {
              "success": "scrollFake"
            }
          }
        }
      },
      "scrollFake": {
        "S2": {
          "to": "S3",
          "handler": {
            "fn": "scrollFake",
            "args": {
              "pause": [
                500,
                600
              ],
              "dir": 1,
              "delay": [
                30,
                40
              ],
              "numScroll": [
                3,
                5
              ],
              "limit": -1
            },
            "results": {
              "nonZero": "clickFake"
            }
          }
        }
      },
      "clickFake": {
        "S3": {
          "to": "S4",
          "handler": {
            "fn": "clickFake",
            "args": {
              "left": "20px",
              "bottom": "20px",
              "delay": 500
            },
            "results": {
              "success": "lookup"
            }
          }
        }
      },
      "lookup": {
        "S4": {
          "to": "S2",
          "handler": {
            "fn": "lookup",
            "args": {
              "condition": "
#check last saved request and state var

(.database[-1].response.body.json.requestn == 4) and (.state.testvar > 1)
"
            },
            "results": {
              "Y": "checkState",
              "N": "scrollFake"
            }
          }
        }
      },
      "checkState": {
        "S2": {
          "to": "S5",
          "handler": {
            "fn": "checkState",
            "args": {
              "condition": ".testvar > 1"
            },
            "results": {
              "Y": "set another state var"
            }
          }
        }
      },
      "set another state var": {
        "S5": {
          "to": "S6",
          "handler": {
            "fn": "set",
            "args": {
              "condition": "{'second': (.database[-1].response.body.json.requestn + 10)}"
            },
            "results": {
              "success": "scroll up"
            }
          }
        }
      },
      "scroll up": {
        "S6": {
          "to": "S7",
          "handler": {
            "fn": "scrollFake",
            "args": {
              "pause": [
                500,
                600
              ],
              "dir": -1,
              "delay": [
                30,
                40
              ],
              "numScroll": [
                5,
                7
              ],
              "limit": -1
            },
            "results": {
              "nonZero": "pause"
            }
          }
        }
      },
      "pause": {
        "S7": {
          "to": "S8",
          "handler": {
            "fn": "pause",
            "args": {
              "for": [
                2000,
                3000
              ]
            },
            "results": {
              "success": "type from state"
            }
          }
        }
      },
      "type from state": {
        "S8": {
          "to": "S0",
          "handler": {
            "fn": "typeFake",
            "args": {
              "left": "5%",
              "top": "254px",
              "fromstate": "'test var is \\(.testvar) at this moment'",
              "delay": 500
            },
            "results": {}
          }
        }
      },
      "typeReal Test string": {
        "S0": {
          "to": "R1",
          "handler": {
            "fn": "typeReal",
            "args": {
              "left": "5%",
              "top": "254px",
              "str": "real test string",
              "delay": 500
            },
            "results": {
              "success": "clearReal",
              "default": "Calibration"
            }
          }
        }
      },
      "Calibration": {
        "R1": {
          "to": "S0",
          "handler": {
            "fn": "typeFake",
            "args": {
              "left": "5%",
              "top": "254px",
              "str": "Error, click calibration first",
              "delay": 500
            },
            "results": {}
          }
        }
      },
      "clearReal": {
        "R1": {
          "to": "R2",
          "handler": {
            "fn": "clearReal",
            "args": {
              "left": "5%",
              "top": "254px",
              "delay": 500
            },
            "results": {
              "success": "scrollReal"
            }
          }
        }
      },
      "scrollReal": {
        "R2": {
          "to": "R3",
          "handler": {
            "fn": "scrollReal",
            "args": {
              "pause": [
                500,
                600
              ],
              "dir": 1,
              "delay": [
                30,
                40
              ],
              "numScroll": [
                3,
                5
              ],
              "limit": -1
            },
            "results": {
              "nonZero": "clickReal"
            }
          }
        }
      },
      "clickReal": {
        "R3": {
          "to": "R4",
          "handler": {
            "fn": "clickReal",
            "args": {
              "left": "20px",
              "bottom": "20px",
              "delay": 1000
            },
            "results": {
              "success": "lookupR"
            }
          }
        }
      },
      "lookupR": {
        "R4": {
          "to": "R2",
          "handler": {
            "fn": "lookup",
            "args": {
              "condition": "
#check last saved request and state var

(.database[-1].response.body.json.requestn == 4) and (.state.testvar > 1)
"
            },
            "results": {
              "Y": "checkStateR",
              "N": "scrollReal"
            }
          }
        }
      },
      "checkStateR": {
        "R2": {
          "to": "R5",
          "handler": {
            "fn": "checkState",
            "args": {
              "condition": ".testvar > 1"
            },
            "results": {
              "Y": "set another state varR"
            }
          }
        }
      },
      "set another state varR": {
        "R5": {
          "to": "R6",
          "handler": {
            "fn": "set",
            "args": {
              "condition": "{'second': (.database[-1].response.body.json.requestn + 10)}"
            },
            "results": {
              "success": "scrollReal up"
            }
          }
        }
      },
      "scrollReal up": {
        "R6": {
          "to": "R7",
          "handler": {
            "fn": "scrollReal",
            "args": {
              "pause": [
                500,
                600
              ],
              "dir": -1,
              "delay": [
                30,
                40
              ],
              "numScroll": [
                5,
                7
              ],
              "limit": -1
            },
            "results": {
              "nonZero": "typeReal from state"
            }
          }
        }
      },
      "typeReal from state": {
        "R7": {
          "to": "S0",
          "handler": {
            "fn": "typeReal",
            "args": {
              "left": "5%",
              "top": "254px",
              "fromstate": "'test var is \\(.testvar) at this moment'",
              "delay": 500
            },
            "results": {}
          }
        }
      }
    }
  }
}`

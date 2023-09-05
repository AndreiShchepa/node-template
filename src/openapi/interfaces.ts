export interface UsersPost {
  post: {
    parameters: {
      header: {
        authorization: string;
      };
    }; 
    responses: {
      content: {
        "application/json": {
          token1: string;
          token2: string;
        };
      };
    };
    requestBody: {};
  };
};

export interface ProblemsPost {
	post: {
		parameters: {
			header: {
				authorization: string;
			};
			path: {
				id: string;
			};
			query: {
				type: string;
			};
		};
		responses: {
			content: {
				"application/json": {
					status: number;
					res: string;
				};
			};
		};
		requestBody: {
			content: {
				"application/json": {
					problemText: string;
					answer: string;
				};
			};
		};
	};
};

export interface ProblemsPatch {
  patch: {
    parameters: {
      header: {
        authorization: string;
      };
      path: {
        id: string;
      };
      query: {
        newType: string;
      };
    };
    responses: {
      content: {
        "application/json": {
          status: number;
          res: string;
        };
      };
    };
    requestBody: {
      content: {
        "application/json": {
          newProblemText: string;
        };
      };
    };
  };
};

export interface ProblemsDelete {
  delete: {
    parameters: {
      header: {
        authorization: string;
      };
      path: {
        id: string;
      };
    }; 
    responses: {
      content: {
        "application/json": {
          status: number;
          res: string;
        };
      };
    };
    requestBody: {};
  };
};
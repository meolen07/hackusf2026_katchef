export type AppTabParamList = {
  Home: undefined;
  Scan: undefined;
  MyFridge: undefined;
  Chatbot: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  ScanResults: undefined;
  EditIngredient: {
    mode: "fridge" | "scan";
    itemId?: string;
    draftId?: string;
  };
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

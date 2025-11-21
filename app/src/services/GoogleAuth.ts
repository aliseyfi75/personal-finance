import { gapi } from 'gapi-script';

export const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
export const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

export const initGoogleClient = async (clientId: string) => {
  return new Promise<void>((resolve, reject) => {
    gapi.load("client:auth2", () => {
      gapi.client.init({
        clientId: clientId,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
      }).then(() => {
        resolve();
      }).catch((error: any) => {
        reject(error);
      });
    });
  });
};

export const signInGoogle = async () => {
  return gapi.auth2.getAuthInstance().signIn();
};

export const signOutGoogle = () => {
  return gapi.auth2.getAuthInstance().signOut();
};

export const isSignedIn = () => {
  return gapi.auth2.getAuthInstance()?.isSignedIn.get();
};

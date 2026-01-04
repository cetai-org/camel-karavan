/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Use a global variable to ensure we only acquire the API once
declare global {
  interface Window {
    __vscodeApi?: any;
  }
}

let vscode;
if (typeof window !== 'undefined' && window.__vscodeApi) {
  // Already acquired, use the cached instance
  vscode = window.__vscodeApi;
} else if (typeof acquireVsCodeApi !== "undefined") {
  try {
    // Try to acquire and cache it
    vscode = acquireVsCodeApi();
    if (typeof window !== 'undefined') {
      window.__vscodeApi = vscode;
    }
  } catch (error) {
    // API was already acquired, try to use the cached instance
    if (typeof window !== 'undefined' && window.__vscodeApi) {
      vscode = window.__vscodeApi;
    } else {
      // If still not available, throw a more helpful error
      throw new Error('VS Code API cannot be acquired and no cached instance available');
    }
  }
}

export default vscode;

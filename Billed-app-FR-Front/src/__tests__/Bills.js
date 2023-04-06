/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockedStore from "../__mocks__/store";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";

// Étant donné que je suis connecté en tant qu'employé
describe("Given I am connected as an employee", () => {
  // Quand je suis sur la page Factures
  describe("When I am on Bills Page", () => {
    // Ensuite la liste des factures doit être ordonnée du plus ancien au plus récent
    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    // Ensuite, l'icône de la facture dans la disposition verticale doit être mise en surbrillance
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });

    // si des factures sont stockées, il devrait afficher les factures
    test("if Bills are Stored, it should display the Bills", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBills = new Bills({
        document,
        onNavigate,
        store: mockedStore,
        localStorage: window.localStorage,
      });
      const spyGetBills = jest.spyOn(newBills, "getBills");
      const billsToDisplay = await newBills.getBills();
      const mockedBills = await mockedStore.bills().list();

      expect(spyGetBills).toHaveBeenCalledTimes(1);
      expect(mockedBills.length).toBe(billsToDisplay.length);
    });
  });
});

// Quand je clique sur le bouton Nouvelle facture
describe("When I click on New Bill Button", () => {
  // Alors le formulaire pour créer une nouvelle facture apparaît
  test("Then the form to create a new bill appear", () => {
    // localStorage employee
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });

    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );

    const html = BillsUI({ data: [] });
    document.body.innerHTML = html;
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const bills = new Bills({
      document,
      onNavigate,
      firestore: null,
      localStorage: window.localStorage,
    });
    const btnNewBill = screen.getByTestId("btn-new-bill");
    const handleClickNewBill = jest.fn(() => bills.handleClickNewBill());
    btnNewBill.click("click", handleClickNewBill);
    fireEvent.click(btnNewBill);
    expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
  });
});

// Quand je clique sur l'icône en forme d'œil d'une facture (handleClickIconEye)
describe("When I click on the eye icon of a bill", () => {
  // Alors une modale doit apparaître
  test("Then a modal must appear", () => {
    const html = BillsUI({ data: bills });
    document.body.innerHTML = html;
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const bill = new Bills({
      document,
      onNavigate,
      store: null,
      localStorage: window.localStorage,
    });
    $.fn.modal = jest.fn();
    const button = screen.getAllByTestId("icon-eye")[0];
    const handleClickIconEye = jest.fn((e) => {
      e.preventDefault();
      bill.handleClickIconEye(button);
    });
    button.addEventListener("click", handleClickIconEye);
    fireEvent.click(button);
    expect(handleClickIconEye).toHaveBeenCalled();
  });
});

// test integration GET
// Etant donné que je suis un utilisateur connecté en tant qu'employé
describe("Given I am a user connected as Employee", () => {
  // Quand j'accède à Factures
  describe("When I navigate to Bills", () => {
    // récupère les factures de l'API simulée GET
    test("fetches bills from mock API GET", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      onNavigate(ROUTES_PATH["Bills"]);
      const get = jest.fn(mockedStore.bills);
      await waitFor(() => {
        screen.getByText("Mes notes de frais");
        screen.getByText("Nouvelle note de frais");
        screen.getAllByTestId("tbody");
      });
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      expect(screen.getByText("Nouvelle note de frais")).toBeTruthy();
      expect(screen.getAllByTestId("tbody")).toBeTruthy();
      expect(get).toHaveBeenCalled;
    });
  });

  // tests erreurs 404/500
  // Quand une erreur survient sur l'API
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockedStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });

    // récupère les factures d'une API et échoue avec une erreur de message 404
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockedStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      document.body.innerHTML = BillsUI({ error: "Erreur 404" });
      const message = screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    // récupère les factures d'une API et échoue avec une erreur de message 500
    test("fetches bills from an API and fails with 500 message error", async () => {
      mockedStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      document.body.innerHTML = BillsUI({ error: "Erreur 500" });
      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});

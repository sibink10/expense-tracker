import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Save, Target } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Btn, Inp, MultiFileUp, PageShell } from "../ui";
import { C, R } from "../../shared/theme";
import { createForecastForm, getForecastById, updateForecastForm } from "../../shared/api/forecast";
import { useAppContext } from "../../context/AppContext";
import { canEditForecastRequest } from "../../shared/expensePermissions";

const GRID_BREAKPOINT = 680;

export default function ForecastFormPageContent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t, user } = useAppContext();
  const editing = Boolean(id);
  const [narrow, setNarrow] = useState(typeof window !== "undefined" && window.innerWidth < GRID_BREAKPOINT);
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [expectedAmount, setExpectedAmount] = useState("");
  const [expectedExpenseDate, setExpectedExpenseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [editAllowed, setEditAllowed] = useState(!editing);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < GRID_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    getForecastById(id)
      .then((forecast) => {
        if (!alive) return;
        if (!forecast) {
          setError("Forecast not found");
          setEditAllowed(false);
          return;
        }
        if (!canEditForecastRequest(forecast, user)) {
          setError("This forecast cannot be edited");
          setEditAllowed(false);
          return;
        }
        setEditAllowed(true);
        setTitle(forecast.title);
        setPurpose(forecast.purpose);
        setDescription(forecast.description);
        setExpectedAmount(String(forecast.expectedAmount));
        setExpectedExpenseDate(forecast.expectedExpenseDate);
        setNotes(forecast.notes ?? "");
      })
      .catch(() => {
        setError("Could not load forecast");
        setEditAllowed(false);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, user]);

  const today = new Date().toISOString().split("T")[0];

  const canSave =
    title.trim() !== "" &&
    purpose.trim() !== "" &&
    Number(expectedAmount) > 0 &&
    expectedExpenseDate !== "" &&
    !loading &&
    editAllowed;

  const save = async () => {
    if (!canSave) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("purpose", purpose.trim());
      if (description.trim()) formData.append("description", description.trim());
      formData.append("expectedAmount", String(Number(expectedAmount)));
      formData.append("expectedExpenseDate", expectedExpenseDate);
      if (notes.trim()) formData.append("notes", notes.trim());
      files.forEach((file) => formData.append("SupportingDocuments", file));
      const forecast = editing && id ? await updateForecastForm(id, formData) : await createForecastForm(formData);
      t(editing ? "Forecast updated" : "Forecast created");
      navigate(`/forecasts/${forecast.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save forecast");
    } finally {
      setLoading(false);
    }
  };

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
    gap: "14px",
  };

  return (
    <PageShell
      header={
        <h1 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 20px", color: C.text, fontSize: narrow ? "18px" : "24px", fontWeight: 600 }}>
          <Target size={narrow ? 18 : 22} color={C.text} strokeWidth={1.8} />
          {editing ? "Edit forecast" : "Create forecast"}
        </h1>
      }
    >
      <div style={{ background: "#fff", borderRadius: R.control, padding: narrow ? "16px" : "20px", boxShadow: "0px 2px 3px 0px #253EA70A" }}>
        <Inp label="Forecast title" value={title} onChange={(e) => setTitle(e.target.value)} req controlSx={{ borderRadius: R.control }} />
        <div style={gridStyle}>
          <Inp label="Expected amount (₹)" type="number" value={expectedAmount} onChange={(e) => setExpectedAmount(e.target.value)} req min="1" controlSx={{ borderRadius: R.control }} />
          <Inp label="Expected expense date" type="date" value={expectedExpenseDate} onChange={(e) => setExpectedExpenseDate(e.target.value)} req min={today} controlSx={{ borderRadius: R.control }} />
        </div>
        <Inp label="Purpose / business justification" type="textarea" value={purpose} onChange={(e) => setPurpose(e.target.value)} req controlSx={{ borderRadius: R.control, minHeight: "74px" }} />
        <Inp label="Description (optional)" type="textarea" value={description} onChange={(e) => setDescription(e.target.value)} controlSx={{ borderRadius: R.control, minHeight: "74px" }} />
        <Inp label="Additional notes" type="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} controlSx={{ borderRadius: R.control }} />
        <MultiFileUp files={files} onChange={setFiles} title="Supporting documents" radius="4px" />
        {error && <Alert sx={{ marginBottom: "14px" }}>{error}</Alert>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <Btn v="secondary" onClick={() => navigate("/forecasts")} sx={{ borderRadius: R.control }}>
            Cancel
          </Btn>
          <Btn onClick={save} disabled={!canSave} sx={{ borderRadius: R.control }}>
            <Save size={14} />
            {loading ? "Saving..." : editing ? "Save" : "Submit forecast"}
          </Btn>
        </div>
      </div>
    </PageShell>
  );
}

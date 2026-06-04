import { CirclePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Btn } from "../ui";
import { useAppContext } from "../../context/AppContext";
import { C } from "../../shared/theme";
import { MODAL_T } from "../../shared/constants";

export type ListPageAddButtonProps = {
  addPath: string;
  /** Short label for desktop, e.g. "Add expense" */
  label: string;
  className?: string;
};

export default function ListPageAddButton({ addPath, label, className }: ListPageAddButtonProps) {
  const navigate = useNavigate();
  const { setMdl } = useAppContext();

  const handleClick = () => {
    if (addPath === "/advances/add") {
      setMdl({ t: MODAL_T.ADV_REQUEST });
      return;
    }
    navigate(addPath);
  };

  return (
    <span className={`list-page-header__add-btn ${className ?? ""}`.trim()}>
      <Btn
        v="primary"
        onClick={handleClick}
        sx={{
          borderRadius: "4px",
          boxShadow: C.cardShadow,
          width: "100%",
          height: "100%",
        }}
        title={label}
      >
        <CirclePlus size={15} strokeWidth={1.8} />
        <span className="list-page-header__add-label">{label}</span>
      </Btn>
    </span>
  );
}

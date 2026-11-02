import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bird, Cat, Check, CheckCircle2, Dog, FileText, Loader2, Rabbit, Upload, X, type LucideIcon } from "lucide-react";
import { useDesignTokens } from "../../DesignTokensContext";
import { useAutoplay } from "../../AutoplayContext";
import { gate } from "../../storyGate";

export type PetType = "cat" | "dog" | "rabbit" | "bird";

const PETS: { id: PetType; label: string; icon: LucideIcon }[] = [
  { id: "cat", label: "Cat", icon: Cat },
  { id: "dog", label: "Dog", icon: Dog },
  { id: "rabbit", label: "Rabbit", icon: Rabbit },
  { id: "bird", label: "Bird", icon: Bird },
];

const FILE_POOL = [
  { name: "vaccination-record.pdf", size: "1.2 MB" },
  { name: "health-certificate.pdf", size: "860 KB" },
  { name: "rabies-vaccination.jpg", size: "2.4 MB" },
];

interface UploadFile {
  name: string;
  size: string;
  progress: number;
}

interface PetInfoCardProps {
  onPetTypeConfirm?: (petType: PetType) => void;
  onComplete?: (petType: PetType | null, files: string[]) => void;
}

type Stage = "pet" | "upload" | "processing" | "success";

/** Three-step pet card: pet type and weight, vaccination records, confirmation. */
export function PetInfoCard({ onPetTypeConfirm, onComplete }: PetInfoCardProps) {
  const { autoplay } = useAutoplay();
  const { dt } = useDesignTokens();
  const blue = dt.colors.host.link;
  const ui = dt.colors.ui;

  const [stage, setStage] = useState<Stage>("pet");
  const [pet, setPet] = useState<PetType | null>(null);
  const [weight, setWeight] = useState("");
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [pressed, setPressed] = useState(false);
  const timers = useRef<number[]>([]);
  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const petRef = useRef(pet);
  const weightRef = useRef(weight);
  petRef.current = pet;
  weightRef.current = weight;
  const filesRef = useRef(files);
  filesRef.current = files;

  const canConfirm = pet !== null && Number(weight) > 0;
  const allDone = files.length > 0 && files.every((f) => f.progress >= 100);

  const confirmPet = () => {
    const chosen = petRef.current;
    if (!chosen || !(Number(weightRef.current) > 0)) return;
    onPetTypeConfirm?.(chosen);
    after(300, () => setStage("upload"));
  };

  const startUpload = () => {
    if (filesRef.current.length > 0) return;
    setFiles(FILE_POOL.map((f) => ({ ...f, progress: 0 })));
  };

  const continueUpload = () => {
    if (!filesRef.current.length || !filesRef.current.every((f) => f.progress >= 100)) return;
    setStage("processing");
    after(1900, () => setStage("success"));
  };

  // upload progress ticks every 300ms
  useEffect(() => {
    if (!files.some((f) => f.progress < 100)) return;
    const id = window.setInterval(() => {
      setFiles((fs) =>
        fs.map((f, i) => (f.progress >= 100 ? f : { ...f, progress: Math.min(100, f.progress + 14 + ((i * 7) % 9)) })),
      );
    }, 300);
    return () => window.clearInterval(id);
  }, [files]);

  // Each beat below runs on its own when autoplay is on, or when the viewer clicks the widget
  // or presses Space when it is off.
  useEffect(() => {
    if (stage !== "pet" || pet) return;
    return gate(autoplay, 2000, () => setPet("dog"));
  }, [stage, pet, autoplay]);

  useEffect(() => {
    if (stage !== "pet" || !pet || weight) return;
    return gate(autoplay, 1500, () => {
      setWeight("1");
      after(400, () => setWeight("12"));
    });
  }, [stage, pet, weight, autoplay]);

  useEffect(() => {
    if (stage !== "pet" || !pet || !(Number(weight) > 0)) return;
    return gate(autoplay, 1500, () => {
      setPressed(true);
      after(500, () => {
        setPressed(false);
        confirmPet();
      });
    });
  }, [stage, pet, weight, autoplay]);

  useEffect(() => {
    if (stage !== "upload" || files.length > 0) return;
    return gate(autoplay, 1700, startUpload);
  }, [stage, files.length, autoplay]);

  useEffect(() => {
    if (stage !== "upload" || !allDone) return;
    return gate(autoplay, 1600, () => {
      setPressed(true);
      after(500, () => {
        setPressed(false);
        continueUpload();
      });
    });
  }, [stage, allDone, autoplay]);

  useEffect(() => {
    if (stage !== "success") return;
    return gate(autoplay, 2800, () => onComplete?.(petRef.current, filesRef.current.map((f) => f.name)));
  }, [stage, autoplay]);

  const petLabel = PETS.find((p) => p.id === pet)?.label.toLowerCase() ?? "pet";
  const button = "h-[44px] rounded-full px-[26px] text-[15px] font-semibold text-white transition-all disabled:opacity-40";
  const pressStyle = (on: boolean) => ({
    background: blue,
    transform: on ? "scale(0.96)" : "scale(1)",
    boxShadow: on ? "0 0 0 4px rgba(20,20,210,0.22)" : "none",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mt-[10px] w-full max-w-[560px] overflow-hidden rounded-[10px] border bg-white"
      style={{ borderColor: "#D6D6D6", borderTop: `4px solid ${blue}`, color: ui.body }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {stage === "pet" && (
          <motion.div
            key="pet"
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            className="p-[22px]"
          >
            <h3 className="text-[18px] font-bold tracking-[-0.01em]">What kind of pet do you have?</h3>
            <p className="mt-[2px] text-[14px]" style={{ color: ui.muted }}>
              Select your pet type to continue
            </p>
            <div className="mt-[16px] grid grid-cols-4 gap-[10px]">
              {PETS.map((p) => {
                const Icon = p.icon;
                const on = pet === p.id;
                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPet(p.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative flex flex-col items-center gap-[8px] rounded-[12px] border-2 px-[6px] py-[16px] transition-colors"
                    style={{ borderColor: on ? blue : ui.borderLight, background: on ? "#F2F2FF" : "#fff" }}
                  >
                    {on && (
                      <span
                        className="absolute right-[6px] top-[6px] flex size-[18px] items-center justify-center rounded-full text-white"
                        style={{ background: blue }}
                      >
                        <Check className="size-[11px]" strokeWidth={3} />
                      </span>
                    )}
                    <Icon className="size-[30px]" strokeWidth={1.6} style={{ color: on ? blue : ui.body }} />
                    <span className="text-[14px] font-semibold">{p.label}</span>
                  </motion.button>
                );
              })}
            </div>

            <motion.div
              initial={false}
              animate={{ height: pet ? "auto" : 0, opacity: pet ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <label className="mt-[16px] block text-[14px] font-semibold">
                Pet weight (lbs)
                <input
                  type="number"
                  min={0}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0"
                  className="mt-[6px] h-[44px] w-[160px] rounded-[8px] border bg-white px-[14px] text-[15px] font-normal outline-none"
                  style={{ borderColor: ui.borderLight }}
                />
              </label>
              <p className="mt-[8px] text-[13px]" style={{ color: ui.muted }}>
                Your {petLabel}’s weight will be combined with your crate’s weight for cargo travel.
              </p>
            </motion.div>

            <button
              type="button"
              disabled={!canConfirm}
              onClick={confirmPet}
              className={`mt-[18px] ${button}`}
              style={pressStyle(pressed)}
            >
              Confirm
            </button>
          </motion.div>
        )}

        {stage === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3 }}
            className="p-[22px]"
          >
            <h3 className="text-[18px] font-bold tracking-[-0.01em]">Upload your pet’s vaccination records</h3>
            <p className="mt-[2px] text-[14px]" style={{ color: ui.muted }}>
              Required: Rabies Vaccination Certificate, Certificate of Veterinary Inspection, USDA-Endorsed Health Certificate
            </p>
            {files.length === 0 ? (
              <button
                type="button"
                onClick={startUpload}
                className="mt-[16px] flex w-full flex-col items-center gap-[6px] rounded-[12px] border-2 border-dashed px-[16px] py-[26px] hover:bg-[#F7F7FF] transition-colors"
                style={{ borderColor: ui.borderLight }}
              >
                <Upload className="size-[26px]" style={{ color: blue }} />
                <span className="text-[14px] font-semibold">Click or drag files to upload</span>
                <span className="text-[12px]" style={{ color: ui.muted }}>
                  PDF, JPG, PNG up to 10MB
                </span>
              </button>
            ) : (
              <ul className="mt-[16px] flex flex-col gap-[10px]">
                {files.map((f) => (
                  <li key={f.name} className="rounded-[10px] border px-[12px] py-[10px]" style={{ borderColor: ui.borderLight }}>
                    <div className="flex items-center gap-[10px]">
                      {f.progress >= 100 ? (
                        <CheckCircle2 className="size-[18px] text-emerald-600" />
                      ) : (
                        <Loader2 className="size-[18px] animate-spin" style={{ color: blue }} />
                      )}
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{f.name}</span>
                      <span className="text-[12px]" style={{ color: ui.muted }}>
                        {f.size} · {Math.min(100, Math.round(f.progress))}%
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${f.name}`}
                        onClick={() => setFiles((fs) => fs.filter((x) => x.name !== f.name))}
                        className="hover:opacity-70"
                      >
                        <X className="size-[14px]" />
                      </button>
                    </div>
                    <div className="mt-[8px] h-[4px] overflow-hidden rounded-full bg-black/10">
                      <div
                        className="h-full rounded-full transition-[width] duration-300"
                        style={{ width: `${Math.min(100, f.progress)}%`, background: f.progress >= 100 ? "#059669" : blue }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              disabled={!allDone}
              onClick={continueUpload}
              className={`mt-[18px] ${button}`}
              style={pressStyle(pressed)}
            >
              Continue
            </button>
          </motion.div>
        )}

        {stage === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-[12px] px-[22px] py-[44px]"
          >
            <Loader2 className="size-[30px] animate-spin" style={{ color: blue }} />
            <p className="text-[15px] font-semibold">Processing your documents…</p>
          </motion.div>
        )}

        {stage === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="p-[22px] text-center"
          >
            <span className="mx-auto flex size-[56px] items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
              <Check className="size-[28px]" strokeWidth={3} />
            </span>
            <h3 className="mt-[12px] text-[22px] font-bold tracking-[-0.01em]">All set!</h3>
            <p className="mt-[2px] text-[14px]" style={{ color: ui.muted }}>
              Your documents were uploaded for your {petLabel} ({weight} lbs).
            </p>
            <ul className="mx-auto mt-[14px] flex max-w-[320px] flex-col gap-[6px] text-left">
              {files.map((f) => (
                <li key={f.name} className="flex items-center gap-[8px] text-[13px]">
                  <FileText className="size-[14px]" style={{ color: blue }} />
                  {f.name}
                </li>
              ))}
            </ul>
            <p className="mt-[14px] text-[13px]" style={{ color: ui.muted }}>
              We’ll review your documents and notify you within 24 hours.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

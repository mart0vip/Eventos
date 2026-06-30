"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { EventCategory } from "@/types/event";
import { createEvent } from "@/store/events";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  ArrowLeft,
  Image,
  Calendar,
  MapPin,
  DollarSign,
  Tag,
  Type,
  CheckCircle,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";

const categoryValues: EventCategory[] = [
  "show-jumping",
  "dressage",
  "cross-country",
  "polo",
  "rodeo",
  "trail-ride",
  "clinic",
  "auction",
  "social",
  "other",
];

const defaultImages: Record<EventCategory, string> = {
  "show-jumping":
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop",
  dressage:
    "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&h=500&fit=crop",
  "cross-country":
    "https://images.unsplash.com/photo-1509343256900-d5fde4d0085a?w=800&h=500&fit=crop",
  polo: "https://images.unsplash.com/photo-1591035897819-f4bdf739f446?w=800&h=500&fit=crop",
  rodeo:
    "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&h=500&fit=crop",
  "trail-ride":
    "https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a?w=800&h=500&fit=crop",
  clinic:
    "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?w=800&h=500&fit=crop",
  auction:
    "https://images.unsplash.com/photo-1534773728080-2110743c3047?w=800&h=500&fit=crop",
  social:
    "https://images.unsplash.com/photo-1508197149814-93e0a5a7abf6?w=800&h=500&fit=crop",
  other:
    "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&h=500&fit=crop",
};

export default function CreateEventPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<EventCategory>("show-jumping");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [currency] = useState("USD");
  const [capacity, setCapacity] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      const newEvent = createEvent({
        title,
        description,
        date,
        endDate: endDate || undefined,
        time,
        endTime: endTime || undefined,
        location,
        address,
        category,
        image: imageUrl || defaultImages[category],
        price: parseFloat(price) || 0,
        currency,
        capacity: parseInt(capacity) || 100,
        organizer,
        tags,
        isFeatured,
      });

      setSubmitting(false);
      setSuccess(true);

      setTimeout(() => {
        router.push(`/events/${newEvent.id}`);
      }, 1500);
    }, 1000);
  };

  if (success) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <CheckCircle size={64} className="text-forest mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold text-stable mb-2">
              {t("createEvent.createdTitle")}
            </h2>
            <p className="text-stable-light">{t("createEvent.createdDesc")}</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="bg-saddle text-white py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/events"
            className="flex items-center gap-1 text-leather-light hover:text-white text-sm mb-3 transition-colors"
          >
            <ArrowLeft size={16} />
            {t("createEvent.backToEvents")}
          </Link>
          <h1 className="text-3xl font-heading font-bold">{t("createEvent.title")}</h1>
          <p className="text-leather-light mt-1">{t("createEvent.subtitle")}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl p-6 border border-dust/50">
            <h2 className="font-heading text-lg font-bold text-stable mb-4 flex items-center gap-2">
              <Type size={20} className="text-saddle" />
              {t("createEvent.basicInfo")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stable mb-1.5">
                  {t("createEvent.eventTitle")}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("createEvent.eventTitlePlaceholder")}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stable mb-1.5">
                  {t("createEvent.description")}
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("createEvent.descriptionPlaceholder")}
                  rows={5}
                  className="input-field resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stable mb-1.5">
                    {t("createEvent.category")}
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as EventCategory)
                    }
                    className="input-field"
                  >
                    {categoryValues.map((value) => (
                      <option key={value} value={value}>
                        {t(`categories.${value}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stable mb-1.5">
                    {t("createEvent.organizerName")}
                  </label>
                  <input
                    type="text"
                    required
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder={t("createEvent.organizerPlaceholder")}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-xl p-6 border border-dust/50">
            <h2 className="font-heading text-lg font-bold text-stable mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-saddle" />
              {t("createEvent.dateTime")}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-stable mb-1.5">
                  {t("createEvent.startDate")}
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stable mb-1.5">
                  {t("createEvent.endDate")}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stable mb-1.5">
                  {t("createEvent.startTime")}
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stable mb-1.5">
                  {t("createEvent.endTime")}
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl p-6 border border-dust/50">
            <h2 className="font-heading text-lg font-bold text-stable mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-saddle" />
              {t("createEvent.location")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stable mb-1.5">
                  {t("createEvent.venueName")}
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("createEvent.venuePlaceholder")}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stable mb-1.5">
                  {t("createEvent.address")}
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("createEvent.addressPlaceholder")}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Tickets & Pricing */}
          <div className="bg-white rounded-xl p-6 border border-dust/50">
            <h2 className="font-heading text-lg font-bold text-stable mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-saddle" />
              {t("createEvent.ticketsPricing")}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-stable mb-1.5">
                  {t("createEvent.price")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={t("createEvent.pricePlaceholder")}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stable mb-1.5">
                  {t("createEvent.capacity")}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder={t("createEvent.capacityPlaceholder")}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Image & Tags */}
          <div className="bg-white rounded-xl p-6 border border-dust/50">
            <h2 className="font-heading text-lg font-bold text-stable mb-4 flex items-center gap-2">
              <Image size={20} className="text-saddle" />
              {t("createEvent.imageTags")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stable mb-1.5">
                  {t("createEvent.imageUrl")}
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder={t("createEvent.imageUrlPlaceholder")}
                  className="input-field"
                />
                {(imageUrl || defaultImages[category]) && (
                  <div className="mt-2 rounded-lg overflow-hidden h-32">
                    <img
                      src={imageUrl || defaultImages[category]}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultImages[category];
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-stable mb-1.5">
                  {t("createEvent.tags")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder={t("createEvent.tagsPlaceholder")}
                    className="input-field"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="btn-secondary shrink-0"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cream-dark text-sm text-stable-light"
                      >
                        <Tag size={12} />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-saddle"
                />
                <span className="text-sm font-medium text-stable">
                  {t("createEvent.markFeatured")}
                </span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn-green text-lg px-8 py-3.5 disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🐴</span>
                  {t("createEvent.creating")}
                </span>
              ) : (
                <>
                  <CheckCircle size={20} />
                  {t("createEvent.publish")}
                </>
              )}
            </button>
            <Link href="/events" className="btn-secondary text-lg px-8 py-3.5">
              {t("createEvent.cancel")}
            </Link>
          </div>
        </form>
      </div>

      <Footer />
    </>
  );
}

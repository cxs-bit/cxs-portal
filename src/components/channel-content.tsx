import Image from "next/image";
import { youtubePlaylistId, type Personal, type Work } from "@/lib/channel-data";
import { ChannelPlaylist } from "./channel-playlist";
import { buttonVariants } from "./ui/button";

export function WorkContent({ work }: { work: Work }) {
  return (
    <article className="site-wrap channel-page work-channel">
      <header className="channel-heading">
        <h1>Work</h1>
        {work.introduction && <p>{work.introduction}</p>}
        {work.cv
          ? <a className={buttonVariants()} href={work.cv.href}>{work.cv.label}</a>
          : <p className="channel-placeholder">CV update coming soon.</p>}
      </header>
      <section className="channel-section">
        <h2>How I work</h2>
        <div className="channel-copy">
          {work.approach.length
            ? work.approach.map(line => <p key={line}>{line}</p>)
            : <p className="channel-placeholder">Working approach coming soon.</p>}
        </div>
      </section>
      <section className="channel-section">
        <h2>Education</h2>
        {work.education.length ? (
          <ul className="channel-copy channel-education" role="list">
            {work.education.map(item => (
              <li key={item.school + item.qualification}>
                <h3>{item.qualification}</h3>
                <p>{item.school}{item.period && <> · {item.period}</>}</p>
              </li>
            ))}
          </ul>
        ) : <p className="channel-copy channel-placeholder">Education details coming soon.</p>}
      </section>
    </article>
  );
}

export function PersonalContent({ personal }: { personal: Personal }) {
  const playlistId = personal.playlist && youtubePlaylistId(personal.playlist);
  return (
    <article className="site-wrap channel-page personal-channel">
      <header className="channel-heading">
        <h1>Personal</h1>
      </header>
      <div className="personal-channel-content">
        {personal.portrait && (
          <figure className="portrait-card">
            <Image unoptimized src={personal.portrait.href} width={600} height={750} alt={personal.portrait.alt} />
            <figcaption>{personal.portrait.caption}</figcaption>
          </figure>
        )}
        <section className="channel-section personal-playlist">
          <h2>Favorite songs</h2>
          {playlistId && personal.playlist
            ? <ChannelPlaylist playlistId={playlistId} href={personal.playlist} />
            : <p className="channel-placeholder">YouTube Music playlist coming soon.</p>}
        </section>
        <section className="channel-section personal-fact">
          <h2>Portfolio fun fact</h2>
          {personal.fact
            ? <p className="channel-copy">{personal.fact}</p>
            : <p className="channel-copy channel-placeholder">Fun fact coming soon.</p>}
        </section>
      </div>
    </article>
  );
}
